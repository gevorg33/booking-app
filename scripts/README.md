# Dev scripts

Shell helpers to run the **dashboard** (Next.js) and **API** (NestJS) together.

## Prerequisites

- **Node.js 20.9+** (recommended: **20.20.2** — repo includes `.nvmrc`)
  ```bash
  nvm install    # reads .nvmrc
  nvm use
  node -v        # should be v20.20.2 or newer
  ```
- PostgreSQL and Redis running (see `backend/.env`)
- From repo root:

```bash
chmod +x scripts/*.sh scripts/lib/*.sh
```

Install dependencies once:

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Commands

| Script | What it does |
|--------|----------------|
| `./scripts/dev-local.sh` | FE + BE on **localhost** only (`127.0.0.1`) |
| `./scripts/dev-lan.sh` | FE + BE on **LAN** — phone/tablet on same Wi‑Fi can connect |
| `./scripts/dev-lan-backend.sh` | **Backend only** on LAN (provider mobile app) |
| `./scripts/dev-frontend.sh` | **Frontend only** on port 3000 |
| `./scripts/dev-backend.sh` | **Backend only** on port 3001 |
| `./scripts/dev-stop.sh` | Stop processes on ports **3000** and **3001** |

Add `-k` or `--kill` to `dev-local.sh` / `dev-lan.sh` to free ports before starting:

```bash
./scripts/dev-local.sh --kill
./scripts/dev-lan.sh -k
```

Or run **frontend / backend separately** in two terminals:

```bash
./scripts/dev-backend.sh    # terminal 1 — API :3001
./scripts/dev-frontend.sh   # terminal 2 — dashboard :3000
```

Or use npm from repo root:

```bash
npm run dev          # localhost
npm run dev:lan      # LAN
npm run dev:lan:be   # backend only, LAN
npm run dev:stop
```

## URLs

| Mode | Dashboard | API |
|------|-----------|-----|
| Local | http://localhost:3000 | http://localhost:3001 |
| LAN | http://\<your-ip\>:3000 | http://\<your-ip\>:3001 |

Find your Mac IP:

```bash
ipconfig getifaddr en0
```

## Provider mobile app (LAN)

1. Start the API on LAN:
   ```bash
   ./scripts/dev-lan-backend.sh
   # or full stack:
   ./scripts/dev-lan.sh
   ```

2. `dev-lan.sh` / `dev-lan-backend.sh` run `provider-app/scripts/prepare-env.sh`, which sets `VITE_API_URL` to your current LAN IP in `provider-app/.env`.

3. Rebuild or sync the native app after an IP change:
   ```bash
   cd provider-app
   npm run build
   npx cap sync
   # Android APK (debug):
   npm run build:apk:lan
   ```

4. Install the APK on a **physical device** on the **same Wi‑Fi** as your Mac.

**Android emulator:** use `VITE_API_URL=http://10.0.2.2:3001` in `provider-app/.env` (host machine from emulator).

**iOS simulator:** `http://127.0.0.1:3001` or your Mac LAN IP works.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `EADDRINUSE` on 3000/3001 | `./scripts/dev-stop.sh` then start again |
| Phone cannot reach API | Same Wi‑Fi; macOS firewall allows Node; use `dev-lan.sh` not `dev-local.sh` |
| Wrong API in mobile app | Re-run `./scripts/dev-lan-backend.sh` (updates `.env`) and rebuild |
| CORS errors from LAN dashboard | Use `dev-lan.sh` (sets `CORS_ORIGIN` for your IP) |
| Frontend hangs / never loads | Use Node **20.9+** (`nvm use`); dev script uses `--webpack` (Turbopack can hang) |
| `Node.js version >=20.9.0 is required` | Run `nvm use 20.20.2` before starting dev scripts |

## Environment overrides

```bash
BACKEND_PORT=3001 FRONTEND_PORT=3000 ./scripts/dev-local.sh
LAN_IP=192.168.1.50 ./scripts/dev-lan.sh   # if auto-detect fails
```
