# Deploying ZepKart (Vercel + Postgres)

## 1. Create a Postgres database
Any Postgres 14+ works (Vercel Postgres / Neon / Supabase). Copy its connection string.

## 2. Set environment variables in Vercel (Project → Settings → Environment Variables)
| Name | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (use the SSL URL your provider gives). |
| `JWT_SECRET` | yes | Long random string. The app refuses to start in production without it. |
| `ADMIN_ACCESS_PASSWORD` | yes | Password required for "Signup as admin". Without it, admin signup is disabled in production. |
| `SEED_TOKEN` | optional | Only needed to call `POST /api/seed` for demo data. Remove it after seeding. |

## 3. Apply migrations (once per database, and after each new migration file)
From a machine with the repo checked out:

```bash
npm ci
DATABASE_URL="<your connection string>" npm run db:migrate
```

## 4. Seed demo data (optional, first deploy only)
```bash
curl -X POST https://<your-domain>/api/seed -H "x-seed-token: <SEED_TOKEN>"
```
Seeding is not idempotent; the endpoint returns `{"seeded":false}` if data already exists.

The demo buttons on `/auth` also create this data on their first click if the database is empty.
To keep production free of demo accounts, set `DISABLE_DEMO_SEED=1` and seed only from a trusted machine.

## 5. Deploy
Import the GitHub repo in Vercel (framework: Next.js). Build command `npm run build`.
Demo accounts are listed on `/auth`. Change or remove them before accepting real customers.

## Notes
- Uploaded ad videos (max 60 s) and images are stored in Postgres (`media_files`), so no object storage is needed.
- Demo featured clips are served from `public/demo-ads/`.
