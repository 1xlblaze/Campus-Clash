# Campus Clash

**Play anywhere. Challenge everyone. Represent your campus.**

A mobile-first **board game** hub: **Ludo**, **Snakes & Ladders**, and **Campus Monopoly** — play vs CPU instantly, no signup wall.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase (Postgres, RLS, server-validated scoring)
- Vercel-ready

## Run locally
```bash
npm install
cp .env.example .env.local   # add Supabase URL + anon key
npm run dev
```
Open http://localhost:43123 (or the port you choose).

### Deploy on Vercel

See **[docs/VERCEL-DEPLOY.md](docs/VERCEL-DEPLOY.md)** for Git import, CLI token deploy, and GitHub Actions secrets (including Supabase env vars).

Without Supabase env vars the app falls back to **demo scoring** on the device. With Supabase configured, scores are **verified on the server** via RPC functions (see `supabase/README.md`). Optional **email/password accounts** at `/account` link guest rounds after sign-in.

## Important
Never expose a service-role key in browser code. Leaderboards and challenges use verified sessions only.

## Product principles
1. Visitors can play before signup.
2. Inviting a friend is a natural next action after a round.
3. Campus is optional, never an access gate.
4. No cash stakes, entry fees, wallets, or cash prizes.
5. Prioritise repeat play over catalogue size.
