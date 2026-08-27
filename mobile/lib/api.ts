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
  next_best_actions: Array<{
    lead_id: string;
    action: string;
    priority: string;
    reason: string;
    estimated_value: number;
    currency: string;
    score: number;
    stage: string;
    stagnation_hours: number;
    contact?: { name?: string; phone?: string; email?: string } | null;
  }>;
  hot_leads: Array<{
    id: string;
    stage?: string;
    score?: number;
    estimated_value?: number;
    currency?: string;
    contacts?: { name?: string; phone?: string; email?: string } | null;
  }>;
  tasks: Array<{ id?: string; title?: string; priority?: string; due_at?: string }>;
  ops: {
    integrations: Array<{
      integration_type?: string;
      integration_key?: string;
      status?: string;
      severity?: string;
      latency_ms?: number;
      revenue_risk?: boolean;
      estimated_revenue_impact?: number;
      error_code?: string | null;
    }>;
    incidents: Array<{
      id?: string;
      component?: string;
      severity?: string;
      revenue_risk?: boolean;
      estimated_revenue_impact?: number;
      recovery_action?: string | null;
    }>;
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
