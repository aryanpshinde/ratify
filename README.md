<div align="center">

# Ratify

Client delivery portal for freelancers and small agencies — clients, projects, deliverables, and feedback in one branded workspace.

[![CI](https://img.shields.io/github/actions/workflow/status/aryanpshinde/ratify/ci.yaml?style=flat-square&label=CI)](https://github.com/aryanpshinde/ratify/actions/workflows/ci.yaml)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-24-5FA04E?logo=nodedotjs&logoColor=fff&style=flat-square)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-12-F69220?logo=pnpm&logoColor=fff&style=flat-square)](https://pnpm.io)
[![Prettier](https://img.shields.io/badge/code%20style-prettier-F7B93E?logo=prettier&logoColor=fff&style=flat-square)](https://prettier.io)

</div>

![Ratify admin dashboard with stat cards and recently updated projects](docs/screenshots/dashboard.jpg)

**Contents** — [How it works](#how-it-works) · [Admin side](#admin-side) · [Client side](#client-side) · [More screens](#more-screens) · [Tech stack](#tech-stack) · [Architecture](#architecture) · [Repository structure](#repository-structure) · [Getting started](#getting-started) · [License](#license)

Two sides, one link. **Admins** run the studio — clients, projects, deliverables, status. **Clients** get a minimal portal that only shows their own work, and only once it has been submitted.

## How it works

1. Create a client, then a project for them — title, deadline, budget.
2. Add deliverables and version them with file uploads (≤ 10 MB) or external links (Figma, Drive, slides).
3. Press **Submit for review** on a deliverable — drafts stay invisible to the client until then.
4. The client comments and decides: **approve** locks the deliverable as final, **reject** returns it with a note.
5. Iterate. New versions stack on top of the old ones, and every action lands in the project's activity feed.

Project statuses (`Planning → In Progress → Review → Completed`, plus separate `Archived`) are set manually by admins; the deliverable state machine (`draft → submitted → approved / rejected → resubmit`) is what drives client review.

## Admin side

![Dashboard with projects grouped by status](docs/screenshots/status-columns.jpg)

_The dashboard groups every project under its current status, with an archive section collapsed at the bottom._

| New project dialog                                      | Invite client confirmation                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| ![New project dialog](docs/screenshots/new-project.jpg) | ![Invite client confirmation](docs/screenshots/invite-client.png) |

_Projects are created against existing clients. An email invitation links the client to their portal view of the project._

![Project detail page with deliverables, activity feed, and client access](docs/screenshots/project-detail.jpg)

_Project detail: deliverable list with live status chips, the running activity log, and portal access management._

![Clients table](docs/screenshots/clients.jpg)

_The client book — name, contact, company, editable in place._

![Approved deliverable with locked version history](docs/screenshots/deliverable-versions.jpg)

_Every deliverable keeps an append-only version history. Approval permanently locks it — no edits, no new versions — and feedback closes with the decision._

## Client side

Clients never see the dashboard. They arrive over an invitation link, create an account, and land on a portal scoped to their own projects.

| Invitation screen                                     | Sign up screen                                  |
| ----------------------------------------------------- | ----------------------------------------------- |
| ![Invitation screen](docs/screenshots/invitation.jpg) | ![Sign up screen](docs/screenshots/sign-up.jpg) |

_The invitee's first screen is tied to the exact project they were invited to. Account creation stays behind a single form: name, email, password._

![Client portal listing their projects](docs/screenshots/client-portal.png)

_"Your projects" — nothing from other clients is ever visible._

![Client reviewing a submitted deliverable](docs/screenshots/deliverable-review.jpg)

_The review moment: comment on a specific version, then approve or reject._

![Approve deliverable dialog](docs/screenshots/approval-dialog.jpg)

_Approving locks the deliverable as final, stated up front before the click._

![Feedback thread on a rejected deliverable](docs/screenshots/feedback-thread.jpg)

_A rejection returns the deliverable with the note attached; resubmission reopens review while the thread keeps the full conversation._

## More screens

<details>
<summary>8 more views — sign-in, dialogs, and secondary states</summary>

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/sign-in.png" alt="Sign in screen" width="280" /><br><sub>Sign in</sub></td>
    <td align="center"><img src="docs/screenshots/edit-client.jpg" alt="Edit client dialog" width="280" /><br><sub>Edit client</sub></td>
    <td align="center"><img src="docs/screenshots/delete-client.png" alt="Delete client confirmation" width="280" /><br><sub>Delete client</sub></td>
    <td align="center"><img src="docs/screenshots/invitation-accept.png" alt="Accepted invitation state" width="280" /><br><sub>Invitation accepted</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/deliverable-admin.jpg" alt="Deliverable from the admin side" width="280" /><br><sub>Submitted deliverable</sub></td>
    <td align="center"><img src="docs/screenshots/reject-dialog.jpg" alt="Reject deliverable dialog" width="280" /><br><sub>Reject dialog</sub></td>
    <td align="center"><img src="docs/screenshots/upload-version.jpg" alt="Upload file version dialog" width="280" /><br><sub>Upload a version</sub></td>
    <td align="center"><img src="docs/screenshots/add-link-version.jpg" alt="Add link version dialog" width="280" /><br><sub>Attach a link</sub></td>
  </tr>
</table>

</details>

## Tech stack

| Layer    | Tech                                                                             |
| -------- | -------------------------------------------------------------------------------- |
| Frontend | React, Vite, TypeScript, TanStack Router, TanStack Query, Tailwind v4, shadcn/ui |
| Forms    | React Hook Form + Zod                                                            |
| Backend  | Node.js, Hono, TypeScript, Better Auth                                           |
| Database | PostgreSQL on Neon, Drizzle ORM + Drizzle Kit                                    |
| Files    | Neon object storage (S3-compatible)                                              |
| Monorepo | pnpm workspaces                                                                  |
| Hosting  | Cloudflare Workers (web), Render (API), Neon (database)                          |
| CI       | GitHub Actions — typecheck, lint, format, tests, build                           |

## Architecture

[![Built with Cloudflare Workers](https://img.shields.io/badge/built%20with-cloudflare%20workers-F38020?logo=cloudflare&logoColor=fff&style=flat-square)](https://workers.cloudflare.com)

```mermaid
flowchart LR
    B[Browser] --> W["Cloudflare Worker<br>Ratify web (SPA)"]
    W -- "/api/*" --> A["Hono API on Render<br>Better Auth sessions"]
    A --> D[("Neon PostgreSQL<br>Drizzle ORM")]
    A --> S[("Neon object storage<br>S3-compatible")]
```

- Both services deploy on `git push` — Cloudflare Workers Builds for the web worker, Render autodeploy for the API.
- The browser only ever talks to the Worker origin, so auth cookies stay first-party; the Worker proxies `/api/*` to the API (`RENDER_URL`).

> [!NOTE]
> Everything here runs on free tiers. The Render API idles down after 15 minutes without traffic, so the first request after a pause takes about a minute while it cold-starts.

## Repository structure

```text
ratify/
├── apps/
│   ├── web/           # React + Vite frontend, Cloudflare Worker proxy
│   └── api/           # Hono + Better Auth API
├── docs/
│   └── screenshots/   # Screenshots used in this README
└── packages/
    └── shared/        # Shared Zod schemas & types
```

## Getting started

Prerequisites: Node 24 (as pinned in CI) and pnpm 12 (pinned via the `packageManager` field).

```bash
pnpm install
```

Create `apps/api/.env` (see `apps/api/src/lib/env-schema.ts` for the full validation rules):

| Variable             | Required | Notes                                                |
| -------------------- | -------- | ---------------------------------------------------- |
| `DATABASE_URL`       | yes      | Postgres connection string (Neon)                    |
| `BETTER_AUTH_SECRET` | yes      | 32+ characters for production                        |
| `STORAGE_PROVIDER`   | yes      | `neon`                                               |
| `STORAGE_ENDPOINT`   | yes      | S3-compatible endpoint; http loopback allowed in dev |
| `STORAGE_BUCKET`     | yes      |                                                      |
| `STORAGE_ACCESS_KEY` | yes      |                                                      |
| `STORAGE_SECRET_KEY` | yes      |                                                      |
| `STORAGE_REGION`     | yes      |                                                      |
| `PORT`               | no       | Defaults to `3000`                                   |
| `FRONTEND_URL`       | no       | Defaults to `http://localhost:5173`                  |
| `BETTER_AUTH_URL`    | no       | Set explicitly in production                         |

```bash
pnpm --filter @ratify/api db:migrate
pnpm dev
```

> [!TIP]
> `pnpm --filter @ratify/api db:seed` loads optional demo data — an admin user, clients, and a ready-made project flow.

The frontend runs on `http://localhost:5173`, the API on `http://localhost:3000`, and Vite proxies `/api` requests to the backend.

## License

[MIT](LICENSE)
