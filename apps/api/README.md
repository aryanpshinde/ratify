# @ratify/api

Ratify backend API built with Hono, Better Auth, and Drizzle ORM on PostgreSQL (Neon).

## Development

```bash
pnpm dev
```

Serves `http://localhost:3000`. Required environment variables are listed in the [root README](../../README.md); validation rules live in `src/lib/env-schema.ts`.

## Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Tests

```bash
pnpm test
pnpm test:integration
```

Integration tests run against an S3 storage mock; see `.github/workflows/ci.yaml`.
