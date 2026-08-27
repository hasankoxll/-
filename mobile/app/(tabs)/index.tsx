import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getRevenueOverview, RevenueOverview } from '@/lib/api';

function Metric({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.accent]}>{value}</Text>
    </View>
  );
}

export default function RevenueScreen() {
  const [data, setData] = useState<RevenueOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await getRevenueOverview()); }
    catch (e) { setError(e instanceof Error ? e.message : 'LOAD_FAILED'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#c7ff5e" />}
    >
      <Text style={styles.brand}>Vaultify</Text>
      <Text style={styles.title}>Revenue Operating System</Text>
      <Text style={styles.subtitle}>{data?.tenant?.name || 'متابعة الإيرادات والصفقات لحظة بلحظة'}</Text>

      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}

      <View style={styles.grid}>
        <Metric label="Leads" value={data?.counts?.leads ?? 0} />
        <Metric label="Qualified" value={data?.counts?.qualified ?? 0} />
        <Metric label="Hot Leads" value={data?.counts?.hot ?? 0} accent />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hot Leads</Text>
        {(data?.hot_leads || []).slice(0, 5).map((lead) => (
          <View key={lead.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{lead.contacts?.name || lead.contacts?.phone || 'Lead'}</Text>
              <Text style={styles.muted}>{lead.stage || 'new'} • {Number(lead.estimated_value || 0).toLocaleString('ar-SA')} {lead.currency || 'SAR'}</Text>
            </View>
            <View style={styles.score}><Text style={styles.scoreText}>{lead.score ?? 0}</Text></View>
          </View>
        ))}
        {!data?.hot_leads?.length ? <Text style={styles.muted}>لا توجد Hot Leads حاليًا.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07090d' },
  content: { paddingTop: 70, paddingHorizontal: 18, paddingBottom: 120 },
  brand: { color: '#c7ff5e', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#f5f7fb', fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { color: '#8f9bad', marginTop: 8, marginBottom: 22 },
  grid: { gap: 10, marginBottom: 14 },
  metric: { backgroundColor: '#0f131a', borderColor: '#222a35', borderWidth: 1, borderRadius: 18, padding: 18 },
  metricValue: { color: '#f5f7fb', fontSize: 30, fontWeight: '900', marginTop: 6 },
  accent: { color: '#c7ff5e' },
  muted: { color: '#8f9bad', fontSize: 12 },
  card: { backgroundColor: '#0f131a', borderColor: '#222a35', borderWidth: 1, borderRadius: 20, padding: 16 },
  cardTitle: { color: '#f5f7fb', fontSize: 17, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomColor: '#202936', borderBottomWidth: 1 },
  rowTitle: { color: '#f5f7fb', fontWeight: '700', marginBottom: 4 },
  score: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#15200f', borderColor: '#31441f', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scoreText: { color: '#c7ff5e', fontWeight: '900' },
  error: { backgroundColor: '#211', borderColor: '#633', borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 12 },
  errorText: { color: '#f8b4b4' },
});
