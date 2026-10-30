# @ratify/web

Ratify frontend built with React and Vite, deployed as a static SPA behind a Cloudflare Worker that proxies `/api/*` to the backend.

## Development

```bash
pnpm dev
```

Runs on `http://localhost:5173`. Vite proxies `/api` requests to the backend on `http://localhost:3000`.

## Cloudflare Worker

`worker/index.ts` proxies `/api/*` to the API origin configured in `RENDER_URL` (declared in `wrangler.jsonc` vars). Deploys via `npx wrangler deploy -c apps/web/wrangler.jsonc` on every push to `main`.

For the full setup, screenshots, and environment reference, see the [root README](../../README.md).
