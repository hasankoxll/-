import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getMobileBootstrap, MobileBootstrap } from '@/lib/api';

function money(value: number, currency = 'SAR') {
  return `${Number(value || 0).toLocaleString('ar-SA', { maximumFractionDigits: 0 })} ${currency}`;
}

function Metric({ label, value, danger = false, accent = false }: { label: string; value: string | number; danger?: boolean; accent?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.accent, danger && styles.danger]}>{value}</Text>
    </View>
  );
}

export default function RevenueScreen() {
  const [data, setData] = useState<MobileBootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await getMobileBootstrap()); }
    catch (e) { setError(e instanceof Error ? e.message : 'LOAD_FAILED'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const topAction = useMemo(() => data?.next_best_actions?.[0] || null, [data]);
  const degraded = useMemo(() => (data?.ops?.integrations || []).filter(x => x.status !== 'healthy'), [data]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#c7ff5e" />}
    >
      <Text style={styles.brand}>VAULTIFY</Text>
      <Text style={styles.title}>Executive Command Center</Text>
      <Text style={styles.subtitle}>{data?.tenant?.name || 'Revenue Operating System'}</Text>

      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>الإجراء الأهم الآن</Text>
        {topAction ? (
          <>
            <Text style={styles.heroTitle}>{topAction.contact?.name || topAction.contact?.phone || 'فرصة ساخنة'}</Text>
            <Text style={styles.heroReason}>{topAction.reason}</Text>
            <View style={styles.heroMeta}>
              <Text style={styles.chip}>Score {topAction.score}</Text>
              <Text style={styles.chip}>{money(topAction.estimated_value, topAction.currency)}</Text>
              <Text style={[styles.chip, topAction.priority === 'critical' && styles.criticalChip]}>{topAction.priority}</Text>
            </View>
          </>
        ) : <Text style={styles.muted}>لا يوجد إجراء حرج حاليًا.</Text>}
      </View>

      <Metric label="Revenue at Risk" value={money(data?.executive?.revenue_at_risk || 0)} danger={(data?.executive?.revenue_at_risk || 0) > 0} />
      <Metric label="Weighted Pipeline" value={money(data?.executive?.weighted_pipeline || 0)} accent />
      <Metric label="Pipeline Value" value={money(data?.executive?.pipeline_value || 0)} />
      <Metric label="Realized Revenue (latest paid set)" value={money(data?.executive?.realized_revenue_30d || 0)} />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>نبض التشغيل</Text>
          <Text style={[styles.status, degraded.length ? styles.statusWarn : styles.statusGood]}>{degraded.length ? `${degraded.length} تحتاج انتباه` : 'Healthy'}</Text>
        </View>
        {(data?.ops?.integrations || []).slice(0, 6).map((item, i) => (
          <View key={`${item.integration_type}:${item.integration_key}:${i}`} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.integration_key || item.integration_type || 'integration'}</Text>
              <Text style={styles.muted}>{item.error_code || `${item.latency_ms || 0} ms`}</Text>
            </View>
            <Text style={[styles.status, item.status === 'healthy' ? styles.statusGood : styles.statusWarn]}>{item.status || 'unknown'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hot Opportunities</Text>
        {(data?.hot_leads || []).slice(0, 5).map((lead) => (
          <View key={lead.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{lead.contacts?.name || lead.contacts?.phone || 'Lead'}</Text>
              <Text style={styles.muted}>{lead.stage || 'new'} • {money(Number(lead.estimated_value || 0), lead.currency || 'SAR')}</Text>
            </View>
            <View style={styles.score}><Text style={styles.scoreText}>{lead.score ?? 0}</Text></View>
          </View>
        ))}
        {!data?.hot_leads?.length ? <Text style={styles.muted}>لا توجد فرص ساخنة حاليًا.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07090d' },
  content: { paddingTop: 70, paddingHorizontal: 18, paddingBottom: 120, gap: 12 },
  brand: { color: '#c7ff5e', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#f5f7fb', fontSize: 29, fontWeight: '900', marginTop: 7 },
  subtitle: { color: '#8f9bad', marginTop: 7, marginBottom: 6 },
  hero: { backgroundColor: '#101722', borderColor: '#2c3747', borderWidth: 1, borderRadius: 22, padding: 18, marginBottom: 2 },
  heroLabel: { color: '#8f9bad', fontSize: 12, marginBottom: 8 },
  heroTitle: { color: '#f5f7fb', fontSize: 21, fontWeight: '900' },
  heroReason: { color: '#c8d0db', marginTop: 7, lineHeight: 20 },
  heroMeta: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 12 },
  chip: { color: '#cbd4df', borderColor: '#334052', borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11 },
  criticalChip: { color: '#ffb4b4', borderColor: '#6b3131' },
  metric: { backgroundColor: '#0f131a', borderColor: '#222a35', borderWidth: 1, borderRadius: 18, padding: 17 },
  metricValue: { color: '#f5f7fb', fontSize: 28, fontWeight: '900', marginTop: 5 },
  accent: { color: '#c7ff5e' },
  danger: { color: '#ff8f8f' },
  muted: { color: '#8f9bad', fontSize: 12 },
  card: { backgroundColor: '#0f131a', borderColor: '#222a35', borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardTitle: { color: '#f5f7fb', fontSize: 17, fontWeight: '800', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomColor: '#202936', borderBottomWidth: 1 },
  rowTitle: { color: '#f5f7fb', fontWeight: '700', marginBottom: 4 },
  score: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#15200f', borderColor: '#31441f', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scoreText: { color: '#c7ff5e', fontWeight: '900' },
  status: { fontSize: 11, fontWeight: '800' },
  statusGood: { color: '#66e3a4' },
  statusWarn: { color: '#ffc857' },
  error: { backgroundColor: '#211', borderColor: '#633', borderWidth: 1, padding: 12, borderRadius: 12 },
  errorText: { color: '#f8b4b4' },
});
