## Lapasar Corporate API Platform

### Getting Started

- Install dependencies with `bun install`.
- Start the API locally with `bun run dev`.
- Optional watch mode: `bun run dev:watch`.

The HTTP server listens on the host/port defined by environment variables (`APP_HOST`, `APP_PORT`).

### Project Layout

- `apps/api`: Bun/Hono API composition layer (REST, GraphQL, WebSocket, health endpoints).
- `libs/core`: Domain + application layers (entities, value objects, use cases).
- `libs/shared`: Cross-cutting infrastructure (config, logging, retry, cache, messaging, testing helpers).
- `packages/tooling`: Shared developer tooling (Prettier config, OpenAPI generator, build scripts).
- `deploy`: Deployment blueprints for VM, Docker, Kubernetes, alerting.
- `tests`: Integration and contract testing entry-point.

Run `bun run openapi` to scaffold an OpenAPI document (extend script when schemas are defined).
