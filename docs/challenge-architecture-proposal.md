# Product Catalogue PoC — Architecture Proposal

## Scope and assumptions

This proposal follows the requirements supplied in the task. No separate Code Challenge attachment was present in the repository. The PoC covers a product catalogue, text search, product enquiry, and notification delivery. “AI-native” is the project name here; the listed challenge does not require an LLM, embeddings, a vector database, a cache, accounts, or persistent enquiry storage.

The existing `client/` and `server/` split is retained. The API is the only layer that knows about Fake Store API. The browser calls the catalogue API and receives the application’s own product shape.

## 1. Architecture proposal

Use a small layered backend and a page-oriented React client:

```text
React pages/components
        │ typed HTTP client
        ▼
Express routes → request validation → controllers → services
                                                  │          │
                                      ProductProvider    EmailAdapter
                                                  │          │
                                           Fake Store API  Console/dev
```

### Backend responsibilities

- **Routes/controllers:** translate HTTP requests and responses; do not contain catalogue rules.
- **Validators:** validate path, query, and JSON body input at the HTTP boundary. Return a consistent `400` response with field details for invalid input.
- **Services:** implement home/category composition, search behavior, and enquiry orchestration. Services depend on interfaces, not concrete external integrations.
- **Product provider:** map Fake Store API responses into internal `Product` values. It owns URL construction, upstream response checks, and mapping. Its interface allows a fixture or another catalogue source later.
- **Email adapter:** deliver an enquiry notification through an interface. For the PoC use a no-credential console adapter (or a deterministic test fake); later a real SMTP/API adapter can implement the same interface.
- **Error middleware:** map known application errors to HTTP status codes and hide upstream/internal details in production responses.
- **Configuration:** keep the API port, Fake Store API base URL, and exactly five featured product IDs in one validated server configuration module. The featured ID list is adjustable without source changes, for example with a comma-separated environment setting. Reject configuration unless it contains exactly five distinct positive IDs.

The home page’s featured set is the configured five products. A category response marks configured featured products in that category as featured and returns the remaining category products as additional products. If a configured featured product is missing from the upstream, return a safe gateway error rather than a successful response with fewer than five or silently substituting a different ID.

Fake Store API does not provide general free-text search. The provider’s `searchProducts(query)` can fetch the catalogue and perform a case-insensitive substring match over title, description, and category. This is adequate for the small PoC dataset. The provider boundary makes it possible to replace with server-side search later.

### Frontend responsibilities

- Route and render home, category, search results, product detail, and enquiry form views.
- Use a typed API client that only calls this application’s Express API. Do not call Fake Store API from React.
- Keep loading, empty, and error states at the page or reusable data-view level. Keep display components presentational where practical.
- Submit enquiry data to the server; the browser never sends email directly.

### Error behavior

Use a stable error shape: `{ "error": { "code": string, "message": string, "fields"?: Record<string,string> } }`.

- `400` invalid query/body/path, `404` unknown product/category, `502` invalid/unavailable upstream provider, `500` unexpected server failure.
- Enquiry validation failures return `400`. A notification delivery failure returns `502` (or `503`) with no success claim; the PoC does not persist or retry enquiries.
- Frontend shows a concise actionable message and does not expose stack traces.

## 2. Folder structure

```text
client/
  src/
    components/       # Header, ProductCard, ProductGrid, SearchForm, EnquiryForm
    pages/            # HomePage, CategoryPage, SearchPage, ProductPage
    services/         # catalogueApi.ts (typed calls to our Express API)
    types/            # client-facing API DTOs
    App.tsx            # routes and shared layout
server/
  src/
    app.ts             # Express app factory and middleware wiring
    index.ts           # listen/startup entry point
    config/            # validated env/config including five featured IDs
    routes/            # products.routes.ts, categories.routes.ts, enquiries.routes.ts
    controllers/       # HTTP request/response mapping
    validators/        # query, params, and body schemas
    services/          # catalogue.service.ts, enquiry.service.ts
    providers/
      product/         # ProductProvider interface and fakeStore provider/mapper
      email/           # EmailAdapter interface and console adapter
    middleware/        # notFound and errorHandler
    models/            # internal Product and Enquiry types
  tests/
    unit/              # service and mapping tests
    integration/       # Express API tests with Supertest and fakes
docs/
  challenge-architecture-proposal.md
```

Use existing dependencies where possible. Add only the challenge essentials if missing: Express, a request/schema validator such as Zod, and Vitest/Supertest with their TypeScript typings. Avoid a monorepo/workspace migration, database, queue, Redis, Qdrant, AI SDK, or design system for this time-box.

## 3. API contract

Base path: `/api`. JSON responses. Product IDs follow Fake Store API’s positive integer IDs, though the client treats them as opaque identifiers.

| Method and path | Query/body | Success response | Purpose |
| --- | --- | --- | --- |
| `GET /api/products/featured` | — | `{ "products": Product[] }` (exactly five) | Home page featured products |
| `GET /api/categories` | — | `{ "categories": string[] }` | Category navigation |
| `GET /api/categories/:category/products` | optional `page`, `limit` only if needed | `{ "category": string, "featured": Product[], "additional": Product[] }` | Category page sections |
| `GET /api/products/search?q=...` | required trimmed `q`, 1–100 chars | `{ "query": string, "products": Product[] }` | Case-insensitive text search |
| `GET /api/products/:id` | positive integer `id` | `{ "product": Product }` | Product details |
| `POST /api/enquiries` | JSON body below | `201 { "message": "Enquiry received" }` | Validate and notify about enquiry |

`Product` response shape:

```ts
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating?: { rate: number; count: number };
}
```

Enquiry request:

```ts
interface CreateEnquiryRequest {
  productId: number;
  name: string;       // trimmed, 1–100 chars
  email: string;      // valid email, max 254 chars
  message: string;    // trimmed, 1–2000 chars
}
```

Reject unknown fields and malformed JSON. Do not echo the message or email in the success response. `POST` returns `404` if the product does not exist and only returns `201` after the email adapter reports successful delivery.

## 4. Data models and interfaces

```ts
// Internal domain model; provider-specific fields do not escape this boundary.
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating?: { rate: number; count: number };
}

interface ProductProvider {
  listProducts(): Promise<Product[]>;
  listCategories(): Promise<string[]>;
  listByCategory(category: string): Promise<Product[]>;
  getById(id: number): Promise<Product | null>;
  searchProducts(query: string): Promise<Product[]>;
}

interface EmailAdapter {
  sendEnquiryNotification(input: EnquiryNotification): Promise<void>;
}

interface EnquiryNotification {
  product: Pick<Product, 'id' | 'title'>;
  customerName: string;
  customerEmail: string;
  message: string;
}

interface EnquiryService {
  submit(input: CreateEnquiryRequest): Promise<void>;
}
```

`CatalogueService` depends on `ProductProvider` and featured IDs. It exposes `getFeatured()`, `getCategoryProducts(category)`, `getProduct(id)`, and `search(query)`. `EnquiryService` resolves the product, then calls `EmailAdapter`; HTTP concerns stay out of both services. Keep request/response DTOs separate from provider response types even if they initially map to the same fields.

## 5. Implementation plan (2–3 hours)

1. **0:00–0:20 — Confirm scaffold and install only required dependencies.** Add Express app factory, config shape, and minimal shared error type. Keep startup separate from app creation for Supertest.
2. **0:20–0:50 — Product provider and catalogue service.** Implement Fake Store API mapping, featured-ID validation, category composition, detail lookup, and local text search.
3. **0:50–1:20 — API boundary.** Add route/controller wiring, validation, consistent error middleware, and enquiry service with console email adapter.
4. **1:20–2:10 — Client journeys.** Build typed API service and the home, category, search, and product detail pages with loading/error/empty states and routing.
5. **2:10–2:35 — Enquiry flow.** Add form validation feedback, product context, submission state, and success/failure messaging.
6. **2:35–3:00 — Focused verification and polish.** Vitest unit tests for mapping, featured/category/search behavior, and validation; Supertest integration tests for success and representative 400/404/502 paths using injected fakes. Check type/build scripts and manually walk the main journeys.

If the time-box tightens, prioritize all required user journeys and their boundary/error cases; defer pagination, caching, persistence, authentication, email vendor setup, AI/semantic search, and visual-system refinements.

## Decisions for this PoC

- Featured products are configured as five product IDs, not hard-coded into UI markup.
- Search is deterministic substring matching over the provider’s small catalog.
- Enquiries are notified but not stored; the email adapter is replaceable and can be tested with an in-memory fake.
- The existing Docker Compose Qdrant/Redis services and AI abstractions are not needed by this challenge and should not be required to run this PoC.
