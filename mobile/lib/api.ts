import { supabase } from './supabase';

const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('AUTH_REQUIRED');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export type NextBestAction = {
  lead_id: string;
  action: 'follow_up_now' | 'recover_stagnant_deal' | 'confirm_meeting_or_close' | 'advance_to_offer' | string;
  priority: string;
  reason: string;
  estimated_value: number;
  currency: string;
  score: number;
  stage: string;
  stagnation_hours: number;
  contact?: { name?: string; phone?: string; email?: string } | null;
};

export type MobileBootstrap = {
  generated_at: string;
  tenant?: { name?: string; status?: string; timezone?: string; locale?: string };
  membership?: { role?: string };
  executive: {
    realized_revenue_30d: number;
    attributed_revenue: number;
    pipeline_value: number;
    weighted_pipeline: number;
    revenue_at_risk: number;
    hot_opportunity_value: number;
    active_leads: number;
    hot_leads: number;
    open_dlq: number;
    critical_incidents: number;
  };
  next_best_actions: NextBestAction[];
  hot_leads: {
    id: string;
    stage?: string;
    score?: number;
    estimated_value?: number;
    currency?: string;
    contacts?: { name?: string; phone?: string; email?: string } | null;
  }[];
  tasks: { id?: string; title?: string; priority?: string; due_at?: string }[];
  ops: {
    integrations: {
      integration_type?: string;
      integration_key?: string;
      status?: string;
      severity?: string;
      latency_ms?: number;
      revenue_risk?: boolean;
      estimated_revenue_impact?: number;
      error_code?: string | null;
    }[];
    incidents: {
      id?: string;
      component?: string;
      severity?: string;
      revenue_risk?: boolean;
      estimated_revenue_impact?: number;
      recovery_action?: string | null;
    }[];
    dlq_count: number;
  };
};

export async function getMobileBootstrap(): Promise<MobileBootstrap> {
  const response = await fetch(`${baseUrl}/functions/v1/mobile-bootstrap`, {
    headers: await authHeaders(),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `HTTP_${response.status}`);
  return body;
}

export async function executeNextBestAction(action: NextBestAction, idempotencyKey: string) {
  const response = await fetch(`${baseUrl}/functions/v1/ai-revenue-action`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      lead_id: action.lead_id,
      action: action.action,
      idempotency_key: idempotencyKey,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `HTTP_${response.status}`);
  return body as {
    ok: boolean;
    duplicate?: boolean;
    action?: string;
    task?: { id?: string; title?: string; status?: string; priority?: string; due_at?: string };
    policy_guard?: string;
    external_side_effect?: boolean;
  };
}

// Backward-compatible internal test activation used by the existing web/MVP flow.
export async function activateLead(leadId: string) {
  const response = await fetch(`${baseUrl}/functions/v1/ai-revenue-action`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ lead_id: leadId }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `HTTP_${response.status}`);
  return body;
}
