# Ember

A calm, keyboard-first daily habit tracker. Check off habits, build streaks, keep the flame alive.

Built with Next.js 16 (App Router), Supabase (Postgres + magic-link auth + RLS), Tailwind v4, shadcn/ui, Motion and Lucide.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL, publishable key and (for migrations) the Session pooler connection string.

3. Apply the database migration:

   ```bash
   psql "$DATABASE_URL" -1 -f supabase/migrations/20260930000000_init_habits.sql
   ```

4. In Supabase → Authentication → URL Configuration, add `http://localhost:3000/auth/callback` to the redirect URLs.

5. Start the dev server:

   ```bash
   npm run dev
   ```

## Keyboard shortcuts

| Action | Keys |
| --- | --- |
| Command palette | `⌘ K` |
| New habit | `N` |
| Check off habit | `1`–`9` |
| Go to Today / Habits / Settings | `G T` / `G H` / `G S` |
| Toggle sidebar | `[` |
