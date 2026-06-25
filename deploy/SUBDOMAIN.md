# Subdomain tenant routing (nginx)

Public booking pages resolve the tenant from the **subdomain** (e.g. `gloss.example.com` → business slug `gloss`).

## Architecture

```
Customer browser
    → gloss.example.com  (wildcard DNS + nginx or Vercel)
    → Next.js frontend (middleware rewrites to /book/gloss/...)
    → NestJS API at api.example.com (or Railway URL)
```

**Reserved subdomains** (not business slugs): `www`, `api`, `mail`, `ftp`, `admin`.

## DNS

```
example.com      A/ALIAS  → nginx / Vercel apex
*.example.com    A/ALIAS  → nginx / Vercel wildcard
api.example.com  CNAME    → Railway (or same nginx host)
```

Each tenant uses its **business slug** as the subdomain (set at registration).

## nginx (self-hosted or reverse proxy)

Templates:

| File | Use case |
|------|----------|
| `deploy/nginx/booking.conf` | Frontend + API on same host (`:3000` / `:3001`) |
| `deploy/nginx/booking.vercel-railway.conf` | nginx terminates TLS; proxies to Vercel + Railway |

Render a config:

```bash
chmod +x deploy/nginx/render-nginx-config.sh

# Self-hosted stack
BOOKING_ROOT_DOMAIN=example.com ./deploy/nginx/render-nginx-config.sh self-hosted

# Vercel frontend + Railway API
BOOKING_ROOT_DOMAIN=example.com \
BOOKING_FRONTEND_UPSTREAM=your-app.vercel.app \
BOOKING_API_UPSTREAM=your-api.up.railway.app \
./deploy/nginx/render-nginx-config.sh vercel-railway
```

Install on Ubuntu:

```bash
sudo cp deploy/nginx/booking.rendered.conf /etc/nginx/sites-available/booking
sudo ln -sf /etc/nginx/sites-available/booking /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Full Docker stack (postgres + redis + backend + frontend + nginx):

```bash
cp deploy/env.production.example deploy/.env.production
# edit JWT_SECRET, BOOKING_ROOT_DOMAIN, DB_PASSWORD
BOOKING_ROOT_DOMAIN=example.com ./deploy/nginx/render-nginx-config.sh self-hosted
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production up -d --build
```

## Backend on Railway

```bash
chmod +x scripts/deploy-backend-railway.sh
./scripts/deploy-backend-railway.sh
```

Railway variables (minimum):

```bash
NODE_ENV=production
JWT_SECRET=<random>
ROOT_DOMAIN=example.com
FRONTEND_URL=https://example.com
PUBLIC_API_URL=https://api.example.com
CORS_ORIGIN=https://example.com
```

`DATABASE_URL` and `REDIS_URL` from Railway plugins are mapped automatically by `docker-entrypoint.sh`.

## Frontend on Vercel (with tenant subdomains)

1. Add domains: `example.com` and `*.example.com` in Vercel project settings.
2. Set env:
   - `NEXT_PUBLIC_API_URL=https://api.example.com`
   - `INTERNAL_API_URL=https://api.example.com`
   - `NEXT_PUBLIC_ROOT_DOMAIN=example.com`

Middleware in `frontend/src/middleware.ts` rewrites `gloss.example.com/` → `/book/gloss/`.

## Local development (no nginx)

1. **Path-based:** `http://localhost:3000/book/<slug>/`
2. **Subdomain simulation:** add to `/etc/hosts`:
   ```
   127.0.0.1 gloss.localhost
   ```
   Then open `http://gloss.localhost:3000/`.

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000

# backend/.env
CORS_ORIGIN=http://localhost:3000
ROOT_DOMAIN=localhost:3000
```

## Tenant branding

Store in `businesses.settings` JSON:

```json
{
  "publicBooking": { "enabled": true },
  "branding": {
    "logoUrl": "https://cdn.example.com/gloss-logo.png",
    "primaryColor": "#7c3aed",
    "tagline": "Beauty & care"
  }
}
```

Update via `PUT /businesses/:id` (authenticated) or directly in the database for now.
