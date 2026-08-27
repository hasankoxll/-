# Vaultify Mobile Architecture Contract

Vaultify Mobile is a native client of the existing Revenue OS. It must not duplicate server-side business logic.

## Boundaries
- Mobile: presentation, local session, push registration, read models, user-approved actions.
- Supabase Edge Functions: tenant authorization, business commands, policy guards.
- Background workers: automation, scoring, retries, reconciliation.
- Database/Vault: system of record and secrets. No provider tokens are exposed to the app.

## Initial mobile surfaces
1. Revenue Overview — leads, qualified, hot leads, revenue metrics.
2. Next Best Action — policy-guarded recommendations and approvals.
3. Pipeline — stage history, Smart Score, Deal Stagnation, estimated value.
4. Ops Watchdog — integration health, incidents, DLQ, Revenue at Risk.
5. Notifications — critical Revenue Risk and actionable alerts.

## Security rules
- Only the Supabase publishable key may be embedded in the client.
- Access/refresh sessions are managed through Supabase Auth storage.
- Meta, Moyasar, Salla and service-role secrets remain server-side/Vault-only.
- Financial, outbound and pipeline-mutating AI actions require server-side Policy Guard + Audit Trail + Idempotency.

## API strategy
Reuse existing Edge Functions first. Add mobile-specific BFF/read endpoints only where payload shape or performance requires it. Never expose raw privileged tables to bypass the existing authorization layer.
