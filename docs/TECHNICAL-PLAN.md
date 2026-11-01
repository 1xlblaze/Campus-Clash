# Technical plan

## Phase 0 — playable prototype
Next.js App Router, TypeScript and Tailwind. Local demo scores and browser sharing. This is what the current starter implements.

## Phase 1 — trusted scores
1. Create Supabase project and apply schema.
2. Add Supabase Auth (guest then account linking).
3. Create a server route to start sessions and return question IDs/options without answer keys.
4. Record answers through a server route. Validate against server-held answer keys and timing bounds.
5. Compute score on the server; never trust a client-provided score.
6. Mark a session verified only after all validation succeeds.
7. Build leaderboards from verified sessions only.
8. Add idempotency keys, per-IP/user rate limits, abuse signals and error monitoring.

## Phase 2 — social
- Persist friend challenge token hashes; expose opaque random tokens, never raw session identifiers.
- Set expiry and abuse controls.
- Add Open Graph metadata and invite attribution.

## Phase 3 — campus
- College directory by city.
- Optional membership; start verification manually.
- Campus ranking aggregates verified points with anti-cheat and minimum participation thresholds.

## Security checklist
- RLS enabled on every exposed table.
- No service-role key in client bundle.
- Questions API never exposes answer keys.
- Score calculation and completion run server-side.
- Validate session ownership and guest tokens.
- Rate-limit auth, challenge, answer and completion endpoints.
- Monitor suspicious score patterns; provide reporting and account deletion.
- Keep public profiles minimal and avoid public direct messages.
