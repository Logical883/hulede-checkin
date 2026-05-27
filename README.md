# Hulede Foundation Check-In Portal

A secure, multi-year attendance check-in system for Hulede Foundation events at KNUST.

## Routes

| Route      | Who uses it | Purpose |
|------------|-------------|---------|
| `/`        | Students    | Self check-in with HFKNUST2026-xxx ID |
| `/staff`   | Staff       | Verify students physically at entrance |
| `/admin`   | Admin only  | Dashboard, stats, Excel upload, CSV export |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and fill in your Supabase URL and anon key:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ACTIVE_EVENT_ID=HFKNUST2026
```

### 3. Run locally
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

## Admin PIN
The default admin PIN is `2026HF`. Change it in `src/pages/Admin.jsx` before deploying:
```js
const ADMIN_PIN = 'your-new-pin'
```

## Every new year

1. Log in to `/admin`
2. Click **Upload List** tab
3. Click **+ Create new event year** (e.g. `HFKNUST2027`)
4. Upload the new Excel file
5. Update `VITE_ACTIVE_EVENT_ID=HFKNUST2027` in your Vercel environment variables

Old years remain in the database — no data is ever deleted.

## Excel format expected
The system auto-detects the header row. Your Excel just needs columns in this order:
```
SN | HFKNUST ID | Full Name | Student No. | Email | Phone | WhatsApp
```
