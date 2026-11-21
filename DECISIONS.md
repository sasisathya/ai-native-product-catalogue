# Decisions (ADRs)

Short architecture-decision records. Most recent first. Each entry: context,
decision, consequences. Keep entries immutable; supersede instead of rewriting.

---

## ADR-001: Monorepo over separate repos

**Context.** Client and server share product/search type contracts and are
developed together.

**Decision.** Single repo, two packages (`client/`, `server/`), no workspace
tooling yet.

**Consequences.**
- Shared types can be reused or generated between packages.
- One repo to clone; CI builds both.
- No package-manager workspace yet — add when install/test scripts need
  coordination.

## ADR-002: Provider-agnostic AI core

**Context.** We expect to use multiple/evolving LLM and embedding providers;
locking into one SDK would create churn.

**Decision.** All AI access goes through interfaces in `server/src/providers/`.
The active provider is selected by `AI_PROVIDER` in config; business logic
(`services/`) depends only on the interface.

**Consequences.**
- Swapping a provider is a config + provider change, not a logic change.
- A small indirection cost; mocked easily in tests.
- See `AI_USAGE.md` for the provider contract.

## ADR-003: Local-first backing services via Docker Compose

**Context.** Vector search and caching are needed but should not block local
dev or require paid infra.

**Decision.** `docker-compose.yml` provides `qdrant` (vectors) and `redis`
(cache). Point config at them; swap to managed services in prod via env.

**Consequences.**
- Zero-cost local dev; reproducible environment.
- Prod must override connection env vars.

## ADR-004: Thin controllers, fat services

**Context.** HTTP framework details should not leak into business logic.

**Decision.** Controllers only parse requests and shape responses; all logic
lives in `services/`.

**Consequences.**
- Services are unit-testable without HTTP.
- Easier to add new transports (e.g. gRPC) later.
