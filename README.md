# Ratify

Client delivery portal for freelancers and small agencies. Manage clients, projects, deliverables, and client feedback in a single branded workspace.

## Tech Stack

| Layer    | Tech                                                                             |
| -------- | -------------------------------------------------------------------------------- |
| Frontend | React, Vite, TypeScript, TanStack Router, TanStack Query, Tailwind v4, shadcn/ui |
| Forms    | React Hook Form + Zod                                                            |
| Backend  | Node.js, Hono, TypeScript, Better Auth                                           |
| Database | PostgreSQL on Neon, Drizzle ORM + Drizzle Kit                                    |
| Monorepo | pnpm workspaces                                                                  |

## Repository Structure

```text
ratify/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # Hono + Better Auth API
└── packages/
    └── shared/       # Shared Zod schemas & types
```

## Getting Started

```bash
pnpm install
cp .env.example apps/api/.env   # fill in DATABASE_URL, BETTER_AUTH_SECRET
pnpm --filter @ratify/api db:migrate
pnpm dev
```

Frontend runs on `http://localhost:5173`. API runs on `http://localhost:3000`. Vite proxies `/api` requests to the backend.

## License

MIT
