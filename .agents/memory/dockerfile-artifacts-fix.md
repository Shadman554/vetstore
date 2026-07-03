---
name: Dockerfile artifacts dockerignore fix
description: Why `artifacts` must not be in .dockerignore for Railway builds to succeed.
---

The pnpm workspace includes `artifacts/*` (see `pnpm-workspace.yaml`). The Dockerfile copies `artifacts/mockup-sandbox/package.json` before running `pnpm install --frozen-lockfile` to enable Docker layer caching.

**Why:** If `artifacts` is in `.dockerignore`, this explicit COPY is silently blocked by Docker, causing the build to fail with "file not found". The `**/node_modules` rule in `.dockerignore` already excludes node_modules, so removing `artifacts` from `.dockerignore` is safe — only source files (~a few KB of TS/HTML) get included.

**How to apply:** Keep `artifacts` OUT of `.dockerignore`. This was the cause of 2 Railway deployment failures.
