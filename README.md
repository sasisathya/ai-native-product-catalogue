# Product Catalogue – AI-Native Engineering Challenge

A responsive product catalogue with a React/TypeScript frontend and a Node.js,
TypeScript, and Express backend. The backend fetches product data from Fake Store
API through `ProductProvider`; the browser communicates only with this app’s
REST API.

## Features

- Exactly five configurable featured products.
- Category pages with featured and additional products.
- Text search across product title, description, and category.
- Product details and a validated enquiry form.
- Customer confirmation after successful enquiry submission.
- Replaceable email adapter with console (default) and optional SMTP modes.
- Express-served frontend assets and API from one production container/image.

## Run the complete application in Docker

Requires Docker Engine/Desktop with Docker Compose.

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
```

Open <http://localhost:4000>. Compose serves the React application and API from
the same origin. The default console email adapter allows the enquiry flow to
be exercised without SMTP credentials. It logs product metadata only and does
not deliver or retain the enquiry contents.

Useful checks:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/products/featured
curl http://localhost:4000/api/categories
curl 'http://localhost:4000/api/categories/electronics/products'
curl 'http://localhost:4000/api/products/search?q=shirt'
curl http://localhost:4000/api/products/1
docker compose logs -f catalogue
```

Submit an enquiry (the product must exist):

```bash
curl -X POST http://localhost:4000/api/enquiries \
  -H 'Content-Type: application/json' \
  -d '{"productId":1,"name":"Alex Example","email":"alex@example.com","message":"Please send me more information."}'
```

The API responds with `201 Created` when the enquiry is accepted. With the
default console adapter, acceptance logs the product metadata; it does not send
an email. Stop the application with `docker compose stop`.

The frontend routes (`/categories/:category`, `/search`, `/products/:id`, and
`/thank-you`) are served through the SPA fallback, so reloading a page should
continue to load the React app. API paths under `/api` are excluded from that
fallback.

## Configuration

`.env.example` is a safe template; copy it to `.env` for Docker Compose. The
server reads runtime configuration from environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | HTTP port inside the container |
| `HOST_PORT` | `4000` | Host port published by Compose |
| `FAKE_STORE_API_BASE_URL` | `https://fakestoreapi.com` | Server-side product API URL |
| `PROVIDER_TIMEOUT_MS` | `5000` | Upstream request timeout |
| `FEATURED_PRODUCT_IDS` | `1,2,3,4,5` | Exactly five distinct positive product IDs |
| `EMAIL_ADAPTER` | `console` | `console` or `smtp` |

For SMTP, set `EMAIL_ADAPTER=smtp` and provide `SMTP_HOST`, `SMTP_PORT`,
`SMTP_SECURE`, `EMAIL_FROM`, and `EMAIL_TO`. `SMTP_USER` and `SMTP_PASS` are
optional but must be set together. Keep real credentials in the deployment
environment or an uncommitted `.env` file; never commit them.

## Local source development

For hot reload, run the backend and client separately. Vite proxies `/api` to
the backend on port 4000.

```bash
cd server && npm ci && npm run dev
```

In a second terminal:

```bash
cd client && npm ci && npm run dev
```

Open <http://localhost:5173>. The Compose setup is for running the integrated
production build locally; it does not add databases or other unused services.

## Verification commands

Run from each package directory:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Backend tests cover provider mapping/failures/timeouts, configuration, enquiry
handling, validation, and API integration. Frontend tests cover the main routes
and enquiry flow.

## Local Docker verification

The production image was built and run with Docker Compose. The container
reported healthy at `/health`; frontend home and `/products/1` refresh loaded;
and featured products (five), categories, category listing, search, details,
and enquiry submission (`201`) were checked against the local backend. A
SIGTERM stop was also checked in the container logs. The frontend and backend
lint, typecheck, build, and test commands passed (7 frontend tests and 35
backend tests).

This confirms local container operation only. The project has not been
deployed to a public host. SMTP delivery was not exercised because no SMTP
credentials were configured.

## Architecture and decisions

- [Architecture proposal](docs/challenge-architecture-proposal.md)
- [Architecture notes](docs/architecture.md)
- [Decisions](DECISIONS.md)
- [AI usage notes](AI_USAGE.md)

## Limitations

- The console adapter is for local verification only. Configure SMTP or another
  real `EmailAdapter` to deliver notifications.
- Enquiries are not persisted, and the public enquiry endpoint has no spam
  throttling.
- Search fetches the small upstream catalogue and performs a local substring
  match; there is no cache or database.
- Deployment configuration is container-ready but does not provision AWS or
  any other hosting account.
