# The Fresh Cup — Project Context

End-to-end reference: BRD → architecture → build phases → file map → decisions.
Use this doc to onboard a new contributor (or a new Claude session) in 10 minutes.

**Status:** Phases 0–5 shipped. Phase 6 (polish + real icons + final deploy) pending.

---

## 1. Project Overview

Mobile-first **Progressive Web App** for a small cafe to:
- Manage menu (categories + products + staff)
- Take orders fast at the counter via an image-tile grid
- Generate WhatsApp / printable receipts
- Track sales with a daily / weekly / monthly dashboard
- Work offline and auto-sync when back online

All data lives in **a Google Sheet in the owner's Drive** — exportable, viewable, and editable outside the app at any time.

**Total recurring cost:** ₹0 / month.
**Hosted at:** `https://fresh-cup.vercel.app`.

---

## 2. Business Requirements (BRD)

### 2.1 Goals
- **Speed at counter:** ≤3 taps to add an item during rush hour.
- **Reliability:** works without internet; auto-syncs when reconnected.
- **Zero recurring cost:** free hosting, free storage, free dev tools.
- **Owner visibility:** dashboard shows what's selling, when, and by whom.

### 2.2 Scope

**In scope (v1):**
- Category CRUD (add, edit, delete, hide)
- Product CRUD (with image, price, category, in-stock toggle)
- Multi-staff PIN-based login
- Image-grid billing cart (tap to add, +/- quantity)
- WhatsApp / printable receipts
- Offline mode with auto-sync
- Cash & UPI payment tracking
- Day / week / month sales dashboard
- Top-selling products & by-staff breakdown
- All bills persisted in Google Sheet

**Out of scope (v1):**
- Inventory / stock tracking
- GST / tax breakdown
- Customer database / loyalty
- Card payments / payment gateway
- Multi-branch support

### 2.3 Users & Roles

| Role | Capabilities |
|---|---|
| **Owner (admin)** | Everything: manage staff, categories, products, dashboard, all bills |
| **Staff (cashier)** | Create bills, view today's own bills. Cannot edit menu, cannot see dashboard. |

### 2.4 Functional Requirements

| ID | Requirement |
|---|---|
| **FR1** | **Authentication** — Login screen with staff name dropdown + 4-digit PIN. Staff list lives in Google Sheet (`Staff` tab). Admin PIN unlocks Settings & Dashboard. |
| **FR2** | **Category Management (Admin only)** — Add (name, emoji icon, display order, active toggle). Edit / Delete. Delete blocked if products exist under it. |
| **FR3** | **Product Management (Admin only)** — Add (name, price ₹, category, image URL, available toggle). Edit / Delete. "Out of stock" hides from billing without deleting. |
| **FR4** | **Billing flow (cashier hot path)** — Horizontal category tabs → 3-col image-tile product grid → tap to add → sticky cart bar at bottom → bottom-sheet cart → payment toggle → Confirm. Each tap = +1 (no popup); adjust qty inside cart. |
| **FR5** | **Receipt** — Canvas-generated PNG image, on-screen preview, "Share to WhatsApp/anywhere" via Web Share API (text fallback), browser print (CSS `@media print` shows only the receipt), and "Done — Next Customer". |
| **FR6** | **Offline support** — Service worker caches the entire app shell + images. IndexedDB stores menu + pending bills. Pending bills auto-push to Sheet when online. Visible sync status indicator (yellow = pending, blue = syncing, hidden = synced). |
| **FR7** | **Dashboard (Admin only)** — Range pills: Today / Week / Month / Custom. Summary cards (total sales, avg ticket). Bar chart (hourly for Today, daily otherwise). Payment split (Cash/UPI). Top 10 items. By-staff breakdown. |

### 2.5 Non-Functional Requirements

- **Performance:** Product grid renders <1s on a ₹10k Android phone.
- **Mobile-first:** All touch targets ≥44px. Works portrait + landscape.
- **Offline-first:** Zero functional loss offline except the dashboard.
- **Cost:** ₹0/month, scales to ~10,000 bills/day on Google Apps Script free tier.
- **Data ownership:** All data in owner's Google Drive — they can revoke access anytime.

### 2.6 Data Model (Google Sheet tabs)

| Tab | Columns |
|---|---|
| `Staff` | id, name, pin, role, active |
| `Categories` | id, name, icon, display_order, active |
| `Products` | id, name, category_id, price, image_url, available |
| `Bills` | bill_id, datetime, staff_id, subtotal, payment_mode |
| `BillItems` | bill_id, product_id, product_name, qty, unit_price, line_total |
| `Settings` | key, value |

---

## 3. Key Use Cases

**UC1 — Cashier takes order during rush**
1. Cashier logged in, on `/`.
2. Customer: "1 mango milkshake, 2 veg burger"
3. Tap **Milkshake** tab → tap mango tile (badge 1)
4. Tap **Burger** tab → tap veg burger tile twice (badge 2)
5. Tap **"3 items · ₹360 View Bill"** bar.
6. Toggle UPI → tap **Confirm Bill**.
7. Receipt opens → tap **Share** → pick WhatsApp → enter customer → sent.
8. Tap **Done — Next Customer**.

**Total taps:** ~7. **Total time:** under 15 seconds.

**UC2 — Owner adds a new product**
1. Login as admin → Settings → Products → **+ Add Product**.
2. Name: Tender Coconut · Category: Fresh Juice · Price: 60 · paste image URL.
3. Save. Appears in everyone's billing grid immediately (next refresh).

**UC3 — Internet drops mid-rush**
1. App keeps working. Bills save to IndexedDB. Sync pill turns yellow "3 offline".
2. Wifi returns. Pill flashes blue "Syncing…" then disappears.
3. Owner sees all 3 bills in Sheet — nothing lost.

**UC4 — Owner reviews Sunday's sales**
1. Login → Dashboard → **Today** view.
2. ₹4,200 total · 32 bills · Cold Coffee top item (14 sold).
3. Switch to **Week** → "By staff" appears: Ramesh ₹2,800 · Suresh ₹1,400.

---

## 4. Tech Architecture

```
┌────────────────────────────────────────────────┐
│  PWA on phone/tablet                            │
│  React 18 + Vite 7 + Tailwind + React Router    │
│  IndexedDB (idb) — menu cache + pending bills   │
│  Service Worker (vite-plugin-pwa) — app shell   │
│                                  + image cache   │
└─────────────────┬──────────────────────────────┘
                  │ HTTPS POST (text/plain)
                  ▼
┌────────────────────────────────────────────────┐
│  Google Apps Script Web App                     │
│  (acts as REST API · free · no server)          │
└─────────────────┬──────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────┐
│  Google Sheet in owner's Drive                  │
│  Tabs: Staff, Categories, Products, Bills,      │
│        BillItems, Settings                      │
└────────────────────────────────────────────────┘
```

**Stack:**
- **Frontend:** React 18, Vite 7, Tailwind CSS 3, React Router 6, `idb`, Recharts (dashboard only — lazy-loaded)
- **PWA:** `vite-plugin-pwa` (Workbox) — generates SW with runtime caching for images, fonts, API
- **Backend:** Google Apps Script (`apps-script/Code.gs`) deployed as a Web App
- **Storage:** Google Sheet (single source of truth)
- **Hosting:** Vercel free tier — `fresh-cup.vercel.app`
- **CI:** none (Vercel auto-deploys on push to `main`)

**Why this stack:**
- Sheet as DB → owner can view/edit/share/audit raw data with no app
- Apps Script as API → free, zero ops, works behind Google's reliability
- Vite + React + Tailwind → fast dev cycles, small bundles, mature ecosystem
- PWA → no Play Store, instant updates, "Add to Home Screen" feels native

---

## 5. Build Phases

### Phase 0 — Scaffold & infra _(complete)_
**Goal:** Working scaffold deployed at `fresh-cup.vercel.app`, Sheet+API live.

**Built:**
- Vite + React + Tailwind project structure
- PWA manifest, service worker (Workbox)
- PIN-based login screen (hardcoded staff stub at this stage)
- Admin / cashier role-aware routing
- Brown/cream brand theme, mobile-first layout
- Apps Script backend template (auto-creates 6 sheets + seeds sample data)
- `setup.md` walking owner through Sheet creation → Apps Script deploy → Vercel deploy
- Vercel `vercel.json` rewrites so SPA routes (e.g., `/login`) don't 404

**Notable troubleshooting:**
- Vite 8 / `vite-plugin-pwa` peer-dep conflict — pinned to Vite ^7.0.0
- Apps Script `doGet` crash when run manually — added `setup()` callable and made `handle_` safe against undefined `e`
- 403 on `git push` — used `gh auth login` to switch GitHub identity to personal account
- Phone 404 on `/login` — added SPA rewrite to `index.html` via `vercel.json`
- Vercel preview URL behind auth — switched docs to production URL

### Phase 1 — Settings CRUD _(complete)_
**Goal:** Real Settings screen wired to the Sheet for Category/Product/Staff management.

**Built:**
- `src/lib/api.js` — typed wrapper around all 13 Apps Script actions; distinguishes Network/HTTP/Parse/API errors; uses `text/plain` POST to skip CORS preflight
- `src/lib/db.js` — IndexedDB wrapper (`cache` store + `pendingBills` store)
- `src/hooks/useMenu.js` — global menu store: render-from-cache instantly, fetch fresh in background, fall back to cache on error
- `src/components/Modal.jsx` — bottom-sheet on mobile, centered on desktop
- `src/components/Toast.jsx` — imperative `toast('msg','success'|'error'|'info')`, auto-dismiss in 3.5s
- `src/components/CategoryManager.jsx` — add/edit/delete; blocks delete if products attached; shows product count per category
- `src/components/ProductManager.jsx` — add/edit/delete; category filter chips; image preview in form; price validation
- `src/components/StaffManager.jsx` — add/edit/delete; 4-digit PIN validation; can't delete yourself
- `src/lib/auth.js` — rewritten to use real staff from cache via `authenticate(staffList, id, pin)`
- `src/pages/LoginPage.jsx` — three states: not configured / loading / no staff / ready
- `src/pages/SettingsPage.jsx` — three-tab layout (Categories / Products / Staff) with sticky header + manual refresh + "Last synced" footer

### Phase 2 — Billing flow _(complete, bundled with Phase 3)_
**Goal:** Image-grid → cart → confirm → save to Sheet.

**Built:**
- `src/hooks/useCart.js` — cart state (items, qty, payment mode); auto-clears on logout via `logout` window event
- `src/lib/bills.js` — `buildBill()` shapes bill+items; `saveBill()` tries API, falls back to IDB queue if offline
- `src/components/CategoryTabs.jsx` — sticky horizontal scrollable tab strip
- `src/components/ProductGrid.jsx` — 2/3/4-col responsive image tile grid; tap = +1; green count badge for items in cart
- `src/components/Cart.jsx` — sticky bottom bar → bottom-sheet modal with line items, +/- qty, payment toggle, confirm/clear
- `src/pages/BillingPage.jsx` — full rewrite: header + tabs + grid + cart with loading / error / empty / no-categories states
- `src/lib/auth.js` — logout now fires a `logout` event so cart can clear

### Phase 3 — Receipt _(bundled with Phase 2)_
**Goal:** Show on-screen receipt → share to WhatsApp → print → next customer.

**Built:**
- `src/lib/receipt.js` — Canvas-API PNG generation (no extra libs): brand-colored header, 2x retina, dashed dividers, total in brand orange, optional footer
- `src/pages/ReceiptPage.jsx` — bill summary + 3 buttons:
  - **Share** → `navigator.canShare({files})` → system share sheet (WhatsApp, Telegram, Mail, etc.). Falls back to `wa.me/?text=...` with a formatted text receipt
  - **Print** → `window.print()` with `@media print` CSS hiding everything except `#receipt-print`
  - **Done — Next Customer** → clears cart, navigates to `/`
- `src/index.css` — print styles (hides non-receipt elements), `line-clamp-2` utility, `no-scrollbar` utility
- `src/App.jsx` — `/receipt` route added (auth-protected, accepts state via `react-router`)

### Phase 4 — Offline sync _(complete)_
**Goal:** Pending bills auto-push when online; sync indicator; offline images.

**Built:**
- `src/lib/sync.js` — global sync engine with in-flight lock, online/offline listeners, 60s retry loop. `syncPendingBills()` drains the IDB queue via `api.saveBillBatch`.
- `src/hooks/useOnline.js` — React hook for online/offline state
- `src/components/SyncIndicator.jsx` — compact header pill (`SyncIndicator`) + Settings banner (`SyncBanner`) with manual **Sync Now** button
- `src/lib/bills.js` — after successful online save, triggers a sweep of any older queued bills
- `vite.config.js` — service worker now caches:
  - **product-images** (CacheFirst, 30 days, max 200 entries) — works for opaque cross-origin responses
  - **google-fonts-stylesheets** (StaleWhileRevalidate)
  - **google-fonts-webfonts** (CacheFirst)
  - **api-cache** for both `script.google.com` and `script.googleusercontent.com` (NetworkFirst, 5s timeout)
- `src/hooks/useMenu.js` — pre-warms product image cache by firing background `Image()` fetches as soon as the menu loads, so offline shows images even on tabs the user didn't tap
- Workbox config gained `skipWaiting + clientsClaim` so new SW activates without manual reload

**Sync pill states:** Hidden (synced) · Yellow `N pending` / `Offline` / `N offline` · Blue `Syncing…` · Red `Sync error`. Tap pill to force a sync.

### Phase 5 — Dashboard _(complete)_
**Goal:** Today / Week / Month / Custom analytics for the owner.

**Built:**
- `src/lib/dashboard.js` — pure aggregation: `aggregate()` returns totals, hourly/daily series, top products, by-staff. Range presets (`rangeToday/Week/Month/Custom`). `formatCompactINR` (₹1.2K, ₹4.5L).
- `src/hooks/useBills.js` — cache-then-fetch bills for a given range; re-fetches when range changes; tolerates stale cache on error
- `src/components/RangePicker.jsx` — Today / Week / Month / Custom pills; Custom opens a modal with two date inputs
- `src/components/SalesChart.jsx` — Recharts `BarChart` styled with brand color, compact-INR Y axis
- `src/pages/DashboardPage.jsx` — Summary cards → Sales chart → Payment split → Top items → By-staff. Auto-hides staff section on Today view.
- `src/App.jsx` — Dashboard route is `React.lazy()` + `Suspense` so Recharts loads only when admin opens `/dashboard`

**Bundle impact:**
- Cashier main bundle: 67 KB gzip (unchanged from Phase 4)
- Dashboard chunk: 109 KB gzip (lazy, admin-only, SW-cached after first open)

---

## 6. Project Structure (current)

```
cafe-billing-app/
├── apps-script/
│   ├── Code.gs              # Backend deployed to Apps Script
│   └── appsscript.json
├── public/
│   └── icons/               # Placeholder PWA icons (Phase 6 will replace)
├── src/
│   ├── components/
│   │   ├── Cart.jsx                  # Sticky cart + bottom-sheet modal
│   │   ├── CategoryManager.jsx       # Settings → Categories tab
│   │   ├── CategoryTabs.jsx          # Billing screen tab strip
│   │   ├── Modal.jsx                 # Reusable bottom-sheet modal
│   │   ├── ProductGrid.jsx           # Billing screen tile grid
│   │   ├── ProductManager.jsx        # Settings → Products tab
│   │   ├── RangePicker.jsx           # Dashboard date range
│   │   ├── SalesChart.jsx            # Recharts BarChart
│   │   ├── StaffManager.jsx          # Settings → Staff tab
│   │   ├── SyncIndicator.jsx         # Sync pill + banner
│   │   └── Toast.jsx                 # Imperative toast()
│   ├── hooks/
│   │   ├── useBills.js               # Bills fetch + cache per date range
│   │   ├── useCart.js                # Cart state (global)
│   │   ├── useMenu.js                # Menu state (global)
│   │   └── useOnline.js              # Online/offline state
│   ├── lib/
│   │   ├── api.js                    # Apps Script API client
│   │   ├── auth.js                   # PIN auth helpers
│   │   ├── bills.js                  # Bill build + save (with offline fallback)
│   │   ├── dashboard.js              # Aggregations + range presets
│   │   ├── db.js                     # IndexedDB wrapper
│   │   ├── receipt.js                # Canvas PNG generator
│   │   └── sync.js                   # Sync engine
│   ├── pages/
│   │   ├── BillingPage.jsx           # Main screen for cashiers
│   │   ├── DashboardPage.jsx         # Lazy-loaded analytics
│   │   ├── LoginPage.jsx             # PIN keypad
│   │   ├── ReceiptPage.jsx           # Post-bill receipt + share/print
│   │   └── SettingsPage.jsx          # Admin CRUD (3 tabs)
│   ├── App.jsx                       # Routes + auth guards + global setup
│   ├── config.js                     # Cafe config + API URL
│   ├── index.css                     # Tailwind + global + print styles
│   └── main.jsx                      # Entry
├── .env.local                        # VITE_API_URL (not committed)
├── .env.example
├── .gitignore
├── .npmrc                            # legacy-peer-deps safety
├── PROJECT.md                        # ← this file
├── README.md
├── index.html
├── package.json
├── postcss.config.js
├── setup.md                          # Owner setup walkthrough
├── tailwind.config.js
├── vercel.json                       # SPA rewrites
└── vite.config.js                    # Vite + PWA config
```

---

## 7. Key Design Decisions

**1. Google Sheet as the database, not a real DB.**
- Owner can open the Sheet in another tab and audit every bill.
- No infra to operate, no monthly cost, free backup via Drive history.
- Trade-off: cold reads on Apps Script take ~1–2s. Mitigated by IndexedDB cache (render instantly from cache, refresh in background).

**2. Apps Script over Firebase / Supabase.**
- Free forever for this volume. Zero auth setup.
- No per-document quota anxieties. Sheet is owner's own data.
- Trade-off: no real-time push (we live without it — multi-cashier conflicts are rare for a small cafe).

**3. PWA, not React Native / native.**
- Single codebase for iPhone + Android + laptop, instant updates with each push.
- No app store gatekeeping or review delays.
- Tactile feel via `active:scale-[0.98]` + `safe-area-inset` + `Add to Home Screen`.

**4. Offline-first as a first-class concern, not bolted on.**
- IndexedDB queue exists from Phase 2 even though the sync loop didn't ship until Phase 4. Bills never get lost from day one.
- Cache-then-fetch pattern in `useMenu` and `useBills` means UI never blanks on a slow network.

**5. PIN over username/password.**
- Counter has wet hands. Typing email is hostile UX.
- 4-digit PIN is fine for low-stakes cashier identity (audit trail is the real safeguard).
- Admin PIN is the only one that unlocks Settings/Dashboard — keep it strong-ish (1234 is the seeded default — change it).

**6. Receipts are images, not PDFs.**
- WhatsApp shares images natively; PDFs trigger a "preview & confirm" extra step.
- Canvas API generates the PNG with zero deps — no html2canvas, no jsPDF.

**7. Code-split the dashboard.**
- Recharts is ~100KB gzip. Cashiers never open the dashboard. Lazy-load it.
- After first admin visit, the SW caches the chunk so subsequent opens are instant.

---

## 8. Setup Quick Reference

Full walkthrough is in [`setup.md`](./setup.md). Summary:

1. Create a Google Sheet → Extensions → Apps Script → paste `apps-script/Code.gs` → run `setup()` → Deploy as Web App (Execute as Me, Anyone access).
2. Copy the deploy URL → put in `.env.local` as `VITE_API_URL=<url>` and in Vercel project Env Vars.
3. `npm install && npm run dev` for local; or push to `main` → Vercel auto-deploys.
4. Open `https://fresh-cup.vercel.app` on phone → Add to Home Screen.

**Seeded test credentials (replaceable in Settings → Staff):**
| Name | Role | PIN |
|---|---|---|
| Owner | admin | 1234 |
| Ramesh | cashier | 1111 |
| Suresh | cashier | 2222 |

**Seeded sample menu:** Milkshakes (Mango, Chocolate, Strawberry) · Fresh Juices (Papaya, Watermelon, Orange) · Burgers (Veg, Cheese, Paneer).

---

## 9. Known Issues / Future Work (Phase 6 candidates)

- [ ] Replace placeholder brown PNG icons with a real Fresh Cup logo (192 + 512 + maskable)
- [ ] PWA install prompt — handle `beforeinstallprompt` to nudge admin on first visit
- [ ] Settings → Cafe page: edit `cafe_name`, `receipt_footer` from inside the app
- [ ] Bill history view for cashiers (see/reprint today's own bills)
- [ ] Bulk-import products via Sheet paste
- [ ] Stronger admin PIN policy (warn if 1234 still in use)
- [ ] Per-product modifier groups (e.g., "Size: S/M/L") — out of scope for v1
- [ ] Verify offline image cache after one user-reported issue — pre-warm step added but full repro pending

---

## 10. Apps Script API — Action Reference

All endpoints accept POST with `Content-Type: text/plain;charset=utf-8` and body `{ action, ...payload }`. Returns `{ ok: true, data }` or `{ ok: false, error }`.

| Action | Payload | Returns |
|---|---|---|
| `ping` | — | `{ ok, ts }` |
| `getAll` | — | `{ staff, categories, products, settings }` |
| `upsertCategory` | `{ row }` | `row` |
| `deleteCategory` | `{ id }` | `{ deleted: 0 \| 1 }` |
| `upsertProduct` | `{ row }` | `row` |
| `deleteProduct` | `{ id }` | `{ deleted: 0 \| 1 }` |
| `upsertStaff` | `{ row }` | `row` |
| `deleteStaff` | `{ id }` | `{ deleted: 0 \| 1 }` |
| `saveBill` | `{ bill, items }` | `{ bill_id }` |
| `saveBillBatch` | `{ batch: [{bill, items}, ...] }` | `{ saved: [bill_id, ...] }` |
| `getBills` | `{ from, to }` (ISO strings) | `{ bills, items }` |
| `getSettings` | — | `{ key: value, ... }` |
| `updateSetting` | `{ key, value }` | `{ key, value }` |

Sanity-test the deployed Web App URL via:
```
https://script.google.com/macros/s/AKfycb.../exec?action=ping
→ {"ok":true,"data":{"ok":true,"ts":"…"}}
```

---

## 11. Build & Deploy Commands

```bash
# Local dev (with hot reload + network access)
npm run dev

# Production build (verifies all code compiles + SW generation)
npm run build

# Preview the production bundle
npm run preview

# Deploy: commit & push to main — Vercel auto-deploys
git add -A
git commit -m "<phase or change>: <summary>"
git push
```

After every Apps Script change in `apps-script/Code.gs`, re-deploy from the Apps Script editor: **Deploy → Manage deployments → ✏️ → New version → Deploy**. The Web App URL stays the same.

---

## 12. Troubleshooting Quick Reference

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm install` fails on Vercel | Vite peer-dep conflict | `vite: ^7.0.0` pinned in `package.json`; `.npmrc` has `legacy-peer-deps=true` |
| `Cannot read properties of undefined (reading 'parameter')` in Apps Script | Ran `doGet` manually from editor | Run `setup` instead; `doGet` needs an HTTP request |
| Phone gets 404 on `/login` directly | SPA fallback missing | `vercel.json` rewrites `/:path*` to `/index.html` |
| Vercel preview asks for login | Deployment Protection | Use production URL (`fresh-cup.vercel.app`) or disable in Settings → Deployment Protection |
| App loads but says "API not configured" | `VITE_API_URL` missing | Set in `.env.local` (local) or Vercel Env Vars (deploy) |
| Bills don't show in Sheet | Apps Script not deployed as Anyone | Re-deploy Web App with Access: Anyone |
| Stuck on old SW after deploy | Browser caching | Close all tabs of the site, reopen. `skipWaiting + clientsClaim` should auto-update on next load. |
| Product images blank offline | First visit didn't fetch them | Pre-warm step now fetches all images on menu load; visit once online to populate cache. |

---

_Last updated when Phase 5 (Dashboard) shipped. Update this file at the end of each future phase._
