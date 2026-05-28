# OptiSchedule Provider (Ionic React)

Standalone **provider-only** mobile app for iOS and Android. This app does **not** include the business dashboard — only Today, Schedule, and Profile for linked employees.

## Stack

- Ionic React 8 + Vite
- Capacitor 8 (bundled `dist/` — no Next.js WebView)
- React Query + Zustand

## Setup

```bash
cd provider-app
npm install
cp .env.example .env
# Set VITE_API_URL to your backend (e.g. http://127.0.0.1:3001)
```

## Development (browser)

```bash
npm run dev
```

Open http://127.0.0.1:5173

## Native builds

```bash
npm run build
npx cap sync
npm run cap:ios      # open Xcode
npm run cap:android  # open Android Studio
```

On a physical device, set `VITE_API_URL` to your machine's LAN IP (e.g. `http://192.168.1.10:3001`) before building.

## vs `frontend/`

| | `frontend/` | `provider-app/` |
|---|---|---|
| Purpose | Admin dashboard + web PWA at `/provider` | Native provider app only |
| Native | Deprecated Capacitor wrapper | Ionic React + bundled assets |
| Dashboard | Yes (web) | **No** |
