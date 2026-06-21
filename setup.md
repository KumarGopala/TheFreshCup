# The Fresh Cup — Setup Guide

This guide walks you through the **one-time setup** to connect the app to your Google Sheet and put it live on the internet. Total time: ~15 minutes.

---

## Step 1 — Create the Google Sheet (2 min)

1. Open [sheets.new](https://sheets.new) in your browser (this creates a blank Google Sheet in your Drive).
2. Rename it to **`The Fresh Cup — Data`** (top-left, click the title).
3. Leave it open for the next step.

---

## Step 2 — Paste the Apps Script (5 min)

1. With your new sheet open, go to **Extensions → Apps Script**.
2. A new tab opens with a code editor. Delete whatever is in `Code.gs`.
3. Open the file `apps-script/Code.gs` from this project folder (`~/cafe-billing-app/apps-script/Code.gs`) and **copy its entire contents**.
4. Paste into the Apps Script editor.
5. Click the **save icon** (💾) or press `Cmd+S`. Name the project **`Fresh Cup API`** if prompted.
6. In the toolbar, you'll see a function dropdown (between "Debug" and the Run ▶ button). **Click that dropdown and select `setup`** — this is important. Do **not** pick `doGet` or `doPost` (those need an HTTP request and will throw `Cannot read properties of undefined (reading 'parameter')` if run manually).
7. Click **Run ▶**.
   - Google will ask for permissions. Click **Review permissions** → choose your Google account → "Advanced" → "Go to Fresh Cup API (unsafe)" → **Allow**. (Safe — it's your own script.)
   - It finishes in a few seconds and shows a "Setup complete — 6 sheets ready." toast.
   - Switch back to your Sheet tab — you'll see 6 new tabs created (Staff, Categories, Products, Bills, BillItems, Settings) with sample data already filled in.

> **If you already saw that `parameter` error:** no harm done — just select `setup` in the dropdown and click Run again. The script is safe to run multiple times; it only adds rows if the sheet is empty.

---

## Step 3 — Deploy as Web App (3 min)

1. Back in the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon ⚙️ next to "Select type" → choose **Web app**.
3. Fill in:
   - **Description:** `Fresh Cup API v1`
   - **Execute as:** `Me (your-email@gmail.com)`
   - **Who has access:** `Anyone`
4. Click **Deploy**. Authorize again if prompted.
5. **Copy the Web app URL** that appears. It looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
6. Test it: paste the URL into a new browser tab and append `?action=ping`. You should see `{"ok":true,"ts":"..."}`. If yes — your backend is live! 🎉

---

## Step 4 — Connect the app to your backend (1 min)

In the project folder, create a file called `.env.local`:

```bash
cd ~/cafe-billing-app
echo "VITE_API_URL=YOUR_WEB_APP_URL_HERE" > .env.local
```

Replace `YOUR_WEB_APP_URL_HERE` with the URL you copied in Step 3.

> Once Phase 1 is built, you'll also be able to paste the URL inside the app's Settings screen — no env file editing needed.

---

## Step 5 — Run locally on your phone (2 min)

In your terminal:

```bash
cd ~/cafe-billing-app
npm install      # one-time, takes ~1 min
npm run dev      # starts the local server
```

You'll see output like:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.42:5173/
```

**On your phone:** open the **Network** URL (192.168.x.x) in Chrome/Safari. Same wifi as your laptop. The app loads — try the login screen.

Test PINs (Phase 0):
- Owner: PIN `1234`
- Ramesh: PIN `1111`
- Suresh: PIN `2222`

---

## Step 6 — Deploy publicly to Vercel (4 min)

This step puts the app on the internet at a free URL like `fresh-cup.vercel.app` so staff can use it from any phone anywhere.

### 6a. Push code to GitHub

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Create a new **private** repo called `fresh-cup` (don't initialize with README — keep it empty).
3. In your terminal:
   ```bash
   cd ~/cafe-billing-app
   git init
   git add .
   git commit -m "Phase 0: scaffold"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fresh-cup.git
   git push -u origin main
   ```
   It'll prompt for your GitHub username and a Personal Access Token (create one at github.com/settings/tokens — give it `repo` scope).

### 6b. Connect Vercel

1. Sign up at [vercel.com](https://vercel.com) — choose **"Continue with GitHub"** (free, no credit card).
2. Click **Add New → Project** → select `fresh-cup` from the list.
3. Framework preset auto-detects as **Vite**. Leave the rest as default.
4. Click **Environment Variables** and add:
   - Name: `VITE_API_URL`
   - Value: your Apps Script Web App URL from Step 3
5. Click **Deploy**. Wait ~1 min.
6. You'll get a URL like `https://fresh-cup-abc123.vercel.app`. Open it on your phone.

### 6c. Add to Home Screen

- **iPhone (Safari):** open the URL → tap Share icon → "Add to Home Screen" → name it "Fresh Cup".
- **Android (Chrome):** open the URL → tap ⋮ menu → "Add to Home screen".

It now opens fullscreen like a native app. Done!

---

## What's next (Phase 1+)

Once Phase 0 is verified working, the upcoming phases will add:
- **Phase 1:** Real Settings screen to manage categories, products, staff (writes to your Sheet)
- **Phase 2:** Billing screen with image grid + cart
- **Phase 3:** Receipt with WhatsApp/Print
- **Phase 4:** Offline mode with auto-sync
- **Phase 5:** Dashboard with charts

---

## Troubleshooting

**`npm install` fails:**
- Check Node version: `node --version` (need v18 or higher; you have v23, ✅).

**`?action=ping` returns "Authorization required":**
- Re-deploy the Web App with **Who has access: Anyone** (not "Anyone with Google account").

**App loads but says "API not configured":**
- Check `.env.local` exists and has `VITE_API_URL=...` (no quotes, no spaces).
- Restart `npm run dev`.

**Bills don't show in the Sheet:**
- Open the Web App URL in browser with `?action=ping` — must return `{"ok":true}`.
- If it returns HTML, the deploy wasn't set to "Anyone" access.

**Need to redeploy after Code.gs changes:**
- Apps Script → Deploy → **Manage deployments** → pencil icon → Version: "New version" → Deploy. Same URL stays valid.
