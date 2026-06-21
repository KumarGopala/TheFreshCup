# The Fresh Cup — Billing & Sales App

Mobile-first PWA for cafe billing. Tap product images to build a bill, share receipts via WhatsApp, track sales in a dashboard. Works offline. All data in your own Google Sheet.

## Quick start

```bash
npm install
npm run dev
```

For full setup (Google Sheet + deploy to Vercel), see [setup.md](./setup.md).

## Tech

- React 18 + Vite + Tailwind CSS
- React Router for navigation
- IndexedDB (via `idb`) for offline cache & sync queue
- Vite PWA plugin for service worker + manifest
- Recharts for dashboard charts
- Google Apps Script backend → Google Sheet storage

## Project structure

```
cafe-billing-app/
├── apps-script/         # Backend code to paste into Google Apps Script
│   └── Code.gs
├── public/icons/        # PWA icons (placeholder colored squares — replace with logo)
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route pages (Login, Billing, Settings, Dashboard)
│   ├── lib/             # auth, db, api, sync helpers
│   ├── hooks/           # React hooks
│   ├── App.jsx          # Router + auth guards
│   ├── main.jsx         # Entry point
│   ├── index.css        # Tailwind + global styles
│   └── config.js        # Cafe config + API URL
├── setup.md             # Step-by-step deploy guide
└── vite.config.js       # Vite + PWA config
```

## Build phases

- [x] **Phase 0:** Scaffold, login, theme, routing, PWA setup, Apps Script backend template
- [ ] **Phase 1:** Settings — category/product/staff CRUD (writes to Sheet)
- [ ] **Phase 2:** Billing screen — category tabs, product image grid, cart, confirm
- [ ] **Phase 3:** Receipt — canvas image, WhatsApp share, print
- [ ] **Phase 4:** Offline mode — service worker, IndexedDB cache, sync queue, indicator
- [ ] **Phase 5:** Dashboard — day/week/month sales, top products, by-staff
- [ ] **Phase 6:** Polish, real icons, final deploy

## Test users (Phase 0 stub)

| Name | Role | PIN |
|---|---|---|
| Owner | admin | 1234 |
| Ramesh | cashier | 1111 |
| Suresh | cashier | 2222 |
