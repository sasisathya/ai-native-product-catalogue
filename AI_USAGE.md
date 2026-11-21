# AI Usage

This project is *AI-native*: search, recommendations, and content generation are
first-class. To stay flexible, **no AI SDK is imported directly by business
logic** — all AI access goes through the provider abstraction in
`server/src/providers/` (see ADR-002 in [DECISIONS.md](DECISIONS.md)).

## Provider abstraction

`providers/` defines small interfaces, e.g.:

- `EmbeddingProvider` — `embed(text: string): Promise<number[]>`
- `GenerationProvider` — `generate(prompt: string, opts?): Promise<string>`
- `VectorStore` — `upsert`, `search(query, k): Promise<Hit[]>`
- `Cache` — `get` / `set` with TTL

A concrete implementation per backend lives under `providers/` and is selected at
runtime by the `AI_PROVIDER` env var. Business logic (`services/`) depends on
the interfaces, never on a concrete SDK.

```
service ──▶ EmbeddingProvider   ──▶ OpenAI / local / mock
       ──▶ GenerationProvider  ──▶ OpenAI / Anthropic / local
       ──▶ VectorStore         ──▶ Qdrant (see docker-compose.yml)
       ──▶ Cache               ──▶ Redis
```

## Where AI is used

| Feature              | Provider(s)              | Rationale |
| -------------------- | ------------------------ | --------- |
| Semantic search      | Embedding + VectorStore  | Match intent, not just keywords |
| Recommendations      | Embedding + VectorStore  | Similarity over catalogued products |
| Catalogue enrichment | Generation               | Auto-generate descriptions / tags |
| Caching hot results  | Cache                    | Reduce latency + cost |

## Configuration

Set in `.env` (copy from `.env.example`):

- `AI_PROVIDER` — which implementation set to load (`local` | `openai` | …).
- `EMBEDDING_MODEL` / `GENERATION_MODEL` — model identifiers.
- `*_API_KEY` — provider credentials (never committed; see `.gitignore`).

## Cost & safety notes

- Cache embeddings and generated text to avoid recompute.
- Log prompts/responses at a controlled level (`LOG_LEVEL`); redact secrets.
- Validate and size-bound any user text sent to a provider (see
  `validators/`).
- Prefer a local provider in dev so nothing is billed and no data leaves the
  machine.

## Adding a provider

1. Implement the relevant interface in `providers/`.
2. Register it in the provider factory/registry.
3. Select it via `AI_PROVIDER`.
4. Add tests using the `mock` provider to keep CI hermetic.
