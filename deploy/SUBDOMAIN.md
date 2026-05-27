# Subdomain tenant routing (nginx)

Public booking pages resolve the tenant from the **subdomain** (e.g. `gloss.example.com` → business slug `gloss`).

## Architecture

```
Customer browser
    → gloss.example.com  (nginx wildcard DNS + reverse proxy)
    → Next.js frontend (middleware rewrites to /book/gloss/...)
    → NestJS API /public/gloss/...
```

## DNS

Create a wildcard record pointing to your load balancer / server:

```
*.example.com  A  <server-ip>
```

Each tenant uses its **business slug** as the subdomain. The slug is set at registration.

## nginx

See `deploy/nginx.conf.example` for a full config snippet.

## Local development (no nginx)

1. **Path-based:** `http://localhost:3000/book/<slug>/`
2. **Subdomain simulation:** add to `/etc/hosts`:
   ```
   127.0.0.1 gloss.localhost
   ```
   Then open `http://gloss.localhost:3000/` — Next.js middleware rewrites to `/book/gloss/`.

Set env:

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

## Alternative: Vercel / Cloudflare

- **Vercel:** add `*.example.com` as a domain on the Next.js project; middleware handles slug extraction.
- **Cloudflare:** wildcard DNS + proxy to your origin; no nginx required if using a PaaS.
