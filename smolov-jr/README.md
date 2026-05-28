# Smolov Jr. Tracker

Full-stack weightlifting tracker for the Smolov Jr. squat program. Vite + React frontend, Supabase backend (auth + database), deployable to Vercel.

---

## Stack

- **Frontend**: Vite + React
- **Auth + DB**: Supabase (email/password login, Postgres + RLS)
- **Deploy**: Vercel

---

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open **SQL Editor** in the dashboard
3. Paste and run the contents of `supabase-schema.sql`
4. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon / public key**

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install and run locally

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## Deploy to Vercel

### Option A: CLI

```bash
npm install -g vercel
vercel
```

When prompted, add your environment variables (same as `.env`).

### Option B: GitHub

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo
3. Add environment variables in the Vercel dashboard under **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

---

## Enable Email Auth in Supabase

1. Go to **Authentication → Providers** in your Supabase dashboard
2. Make sure **Email** is enabled (it is by default)
3. Optionally disable email confirmation for easier dev: **Authentication → Settings → Disable email confirmations**

---

## Features

- Email + password auth with sign up, login, forgot password
- All data synced to Supabase — works across devices
- Offline fallback via localStorage, syncs when back online
- All 3 weeks of Smolov Jr. (6×6, 7×5, 8×4, 10×3)
- Adjustable weekly weight increment
- Per-day notes and RPE tracking
- Auto-calculates working weights from your 1RM
- Installable as a PWA (Add to Home Screen on iOS/Android)

---

## Install as mobile app (PWA)

After deploying to Vercel:

**iPhone**: Open the Vercel URL in Safari → Share → Add to Home Screen

**Android**: Open in Chrome → 3-dot menu → Add to Home Screen
