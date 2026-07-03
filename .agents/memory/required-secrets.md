---
name: Required environment secrets
description: Secrets that must be set for the app to function fully.
---

Two secrets are required for the admin dashboard to work:

- `ADMIN_PIN` — PIN to unlock the admin panel (e.g. `1234`)
- `JWT_SECRET` — random string (32+ chars) used to sign admin session tokens

Without these, `POST /api/admin/login` returns 500 and all admin CRUD mutations fail with 401.

**How to apply:** Set via Replit Secrets tab (development) and Railway environment variables (production). The backend reads them as `process.env.ADMIN_PIN` and `process.env.JWT_SECRET` in `backend/src/routes/admin.ts`.
