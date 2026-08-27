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

export type RevenueOverview = {
  tenant?: { name?: string };
  counts?: { leads?: number; qualified?: number; hot?: number };
  agent?: { status?: string; conversion_goal?: string };
  hot_leads?: Array<{
    id: string;
    stage?: string;
    score?: number;
    estimated_value?: number;
    currency?: string;
    contacts?: { name?: string; phone?: string };
  }>;
  tasks?: Array<{ id?: string; title?: string; priority?: string; due_at?: string }>;
};

export async function getRevenueOverview(): Promise<RevenueOverview> {
  const response = await fetch(`${baseUrl}/functions/v1/ai-revenue-data`, {
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
