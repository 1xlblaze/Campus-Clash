# Deploy Campus Clash on Vercel

Vercel MCP was not used in the agent environment. Use **Git import** or the **CLI / GitHub Actions** flow below.

## 1. Import from GitHub (fastest)

1. Open [vercel.com/new](https://vercel.com/new) and import **`1xlblaze/Campus-Clash`**.
2. Set **Production Branch** to **`Project1`**.
3. Framework: **Next.js** (auto-detected). Root: `./`.
4. Add **Environment Variables** (Production, Preview, Development):

| Name | Value | Sensitive |
|------|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kqolyvmwcsqilnakuewt.supabase.co` | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → **anon** / legacy JWT | No (public client key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → **service_role** (optional; not required for guest RPC gameplay) | **Yes** |

5. Deploy. Every push to `Project1` triggers a new production deployment when Git is connected.

### Supabase Auth redirect URLs

In Supabase → **Authentication** → **URL configuration**, add:

- Site URL: `https://<your-vercel-domain>`
- Redirect URLs: `https://<your-vercel-domain>/auth/callback`

## 2. CLI + token (no dashboard env paste)

Create a token: Vercel → Account Settings → **Tokens**.

```bash
npm i -g vercel@latest
vercel link   # pick team + new/existing project
# writes .vercel/project.json with orgId + projectId

export VERCEL_TOKEN=your_token
export VERCEL_ORG_ID=...      # from .vercel/project.json
export VERCEL_PROJECT_ID=...
export NEXT_PUBLIC_SUPABASE_URL=https://kqolyvmwcsqilnakuewt.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_jwt
export SUPABASE_SERVICE_ROLE_KEY=your_service_role   # optional

chmod +x scripts/sync-vercel-env.sh
./scripts/sync-vercel-env.sh

vercel deploy --prod
```

Never commit `VERCEL_TOKEN` or `SUPABASE_SERVICE_ROLE_KEY`.

## 3. GitHub Actions (repo secrets)

Workflow: `.github/workflows/vercel-deploy.yml`

Add **Repository secrets** on `Campus-Clash`:

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel personal/team token |
| `VERCEL_ORG_ID` | Team/user id from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Project id from `.vercel/project.json` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional service role |

After secrets exist, push to `Project1` or run **Deploy to Vercel** manually from the Actions tab.

## 4. Verify

- Home loads and **Quick play** works.
- Play a round → result shows **Verified score** when Supabase env is set.
- `/account` sign-in works after Auth URLs are configured.

## CI

`.github/workflows/ci.yml` runs typecheck + build on PRs and pushes (no deploy).
