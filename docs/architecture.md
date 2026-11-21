# Architecture

## Overview

`ai-native-product-catalogue` is a two-package monorepo: a **React + Vite**
client and a **TypeScript** Node.js server that exposes an AI-native product
catalogue API. The server's `providers/` layer abstracts AI backends (embeddings,
generation, retrieval) so the rest of the code is provider-agnostic.

```
ai-native-product-catalogue/
├── client/    React + Vite SPA (catalogue UI)
├── server/    TypeScript API + AI orchestration
├── docs/      Living documentation
└── docker-compose.yml   Local services (e.g. vector DB, cache)
```

## Client (`client/`)

- `src/components/` — reusable UI primitives (cards, forms, layout).
- `src/pages/`      — route-level screens (catalogue, detail, search).
- `src/services/`   — typed API clients (thin wrappers over HTTP calls to the server).
- `src/hooks/`      — React hooks for state/async (useCatalogue, useSearch, …).
- `src/types/`      — shared TS interfaces (Product, SearchResult, …).
- `src/App.tsx`     — root component + router.

## Server (`server/`)

Layered, request-flow: `routes → controllers → services → providers`.

- `src/config/`      — env-driven configuration and validation.
- `src/routes/`      — HTTP route definitions, mounted in `app.ts`.
- `src/controllers/` — thin HTTP adapters: parse request, call a service, shape the response.
- `src/services/`    — application/business logic and orchestration.
- `src/providers/`   — pluggable backends (LLM, embeddings, vector store, cache, storage).
- `src/middleware/`  — cross-cutting concerns (logging, auth, error handling).
- `src/validators/`  — request/scheme validation (zod or equivalent).
- `tests/`           — unit and integration tests.

## Request flow

```
HTTP request
  → middleware (log, auth, validate)
  → route
  → controller (HTTP ↔ app mapping)
  → service (business logic + orchestration)
  → provider (AI / storage backend)
  → response
```

## Design principles

1. **Provider-agnostic core.** Business logic never imports a concrete AI SDK;
   it depends on provider *interfaces* in `providers/`. Swap implementations via
   config.
2. **Typed end-to-end.** Shared contracts flow through `types/` (client) and
   `validators/` (server) to keep client and server in sync.
3. **Thin controllers, fat services.** Controllers do I/O only; logic lives in
   services so it is testable without HTTP.
4. **Fail fast on bad input.** Validation happens at the edge (validators +
   middleware) before reaching services.

See [`../DECISIONS.md`](../DECISIONS.md) for recorded trade-offs and
[`../AI_USAGE.md`](../AI_USAGE.md) for how AI capabilities are integrated.
