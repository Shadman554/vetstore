# Kid Store (WAW Store)

A colorful kids' toy store web app where users browse a product catalog, view product details, and manage inventory via an admin panel.

## Run & Operate

- `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/kid-store run dev` — run the frontend (port 5000)
- `PORT=3000 pnpm --filter @workspace/api-server run dev` — run the API server (port 3000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `./scripts/node_modules/.bin/tsx lib/db/src/seed.ts` — seed demo categories, vendors, and products (safe to re-run, uses `onConflictDoNothing`)
- Required env: `DATABASE_URL` — Postgres connection string, `BASE_PATH` — Vite base path (set to `/`)

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS v4, wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

### Frontend
- `frontend/` — React store app (package: `@workspace/kid-store`)
- `frontend/src/lib/store.ts` — product data store (localStorage-backed)
- `frontend/src/lib/config.ts` — app config (WhatsApp number, admin PIN)
- `frontend/src/lib/site-settings.ts` — brand colors, fonts, text overrides
- `frontend/src/pages/` — Catalog, ProductDetail, Admin pages
- `frontend/src/components/` — shared UI components

### Backend
- `backend/` — Express API server (package: `@workspace/api-server`)

### Shared Libraries
- `lib/db/src/schema/` — Drizzle DB schema (source of truth)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/` — auto-generated React Query hooks
- `lib/api-zod/` — auto-generated Zod schemas

### Tooling
- `artifacts/mockup-sandbox/` — UI prototyping sandbox

## Architecture decisions

- Products are stored in `localStorage` on the client — no server-side persistence needed for the catalog
- Admin panel is PIN-gated (default PIN: `1234`) — see `ADMIN_PIN` in `config.ts`
- Frontend uses Vite's `BASE_PATH` env var for the base URL to support subdirectory deployments
- API server uses esbuild bundling to CJS/ESM for production
- Monorepo uses pnpm workspace `catalog:` for shared dependency version management

## Product

- **Catalog page**: Browse colorful product grid with search
- **Product detail**: View product info and pricing (single vs. bulk)
- **Admin panel**: PIN-protected page to add/edit/delete products, and full Site Settings (colors, fonts, text)
- **WhatsApp ordering**: Products link to WhatsApp for purchase inquiries

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Setup status (imported project)

- Project imported from GitHub; dependencies installed via `pnpm install`, DB schema pushed via `pnpm --filter @workspace/db run push`, and demo data seeded via the seed script above. Both workflows (`Start application`, `Start Backend`) run cleanly.
- `DATABASE_URL`, `ADMIN_PIN`, `JWT_SECRET` are set as secrets. `R2_*` (Cloudflare R2) env vars are NOT set — product image uploads will fail until those are configured; everything else works without them.
- Note: the site is branded "VetMarket" (a vet/pet supply marketplace) despite the repo/package name "kid-store" — this is the actual product content, not a bug.

## Gotchas

- `PORT` and `BASE_PATH` must be set explicitly when running dev commands — they are required env vars in `vite.config.ts`
- Frontend runs on port 5000 (webview), API server runs on port 3000 (console workflow)
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- After moving directories, always run `pnpm install` to relink workspace symlinks

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
