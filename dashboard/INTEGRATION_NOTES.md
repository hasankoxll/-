# Vaultify Revenue OS — Integration Notes

This dashboard is a presentation layer for the existing Vaultify Core Supabase project. Do not create a second business schema.

## Existing core entities expected
- tenants, tenant_members
- channel_accounts
- onboarding_profiles
- plans, subscriptions, trials
- conversations, messages, contacts, leads
- orders, payments, invoices
- revenue_snapshots
- customer_health, retention_actions
- referrals, partner_accounts
- usage_counters
- integration_health

## Existing RPCs / lifecycle rules
- get_tenant_entitlement(tenant_id): authoritative entitlement; UI must never start a trial locally.
- start_tenant_trial(...): server-side only.
- activate_paid_subscription(...): payment provider callback should use this server-side.
- expire_due_trials(): scheduled server-side maintenance.

## Trial contract
- Trial duration is exactly 7 days.
- Trial starts only after WhatsApp transport has been verified by the first real inbound message.
- OAuth completion alone is not a connected state.
- After expiration, automation is suspended but historical analytics remain visible.
- No UI trial reset.

## Connection states to surface distinctly
1. OAuth / credential provisioned.
2. Transport pending / not verified.
3. Transport verified.
4. Connected.
5. Degraded / suspended / disconnected.

## Browser security
- Never expose SUPABASE_SERVICE_ROLE_KEY or Meta secrets.
- Use authenticated browser session + RLS, or server endpoints.
- Public browser may use only Supabase project URL + public anon key after RLS/auth is ready.

## Payment adapter
Not connected yet. A payment provider webhook must validate provider signature server-side and then call activate_paid_subscription. Never mark payment successful from client code.

## Next implementation milestones
1. Authentication + tenant membership resolution.
2. Read-only Supabase adapter backed by RLS-safe views/RPCs.
3. Billing checkout provider adapter.
4. Customer pages: conversations, leads, revenue, growth automation, settings, referrals.
5. SaaS admin portfolio and tenant diagnostics.
