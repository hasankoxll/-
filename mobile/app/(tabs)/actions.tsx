import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { executeNextBestAction, getMobileBootstrap, NextBestAction } from '@/lib/api';

function labelFor(action: string) {
  switch (action) {
    case 'recover_stagnant_deal': return 'إنشاء مهمة استعادة عاجلة';
    case 'confirm_meeting_or_close': return 'إنشاء مهمة إغلاق/تأكيد';
    case 'advance_to_offer': return 'إنشاء مهمة العرض التالي';
    default: return 'إنشاء مهمة متابعة الآن';
  }
}

function createIdempotencyKey(item: NextBestAction) {
  const randomId = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${new Date().getTime()}-${Math.floor(Math.random() * 1_000_000)}`;
  return `${item.lead_id}:${item.action}:${randomId}`;
}

export default function ActionsScreen(){
  const [items,setItems]=useState<NextBestAction[]>([]);
  const [loading,setLoading]=useState(false);
  const [pending,setPending]=useState<Record<string,string>>({});
  const [done,setDone]=useState<Record<string,string>>({});
  const [error,setError]=useState<string|null>(null);

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try{const d=await getMobileBootstrap();setItems(d.next_best_actions||[]);}catch(e){setError(e instanceof Error?e.message:'LOAD_FAILED');}finally{setLoading(false);}
  },[]);

  const [initialLoad] = useState(() => { void load(); return true; });
  void initialLoad;

  async function approve(item:NextBestAction){
    const key=createIdempotencyKey(item);
    setPending((x)=>({...x,[item.lead_id]:key}));
    setError(null);
    try{
      const r=await executeNextBestAction(item,key);
      setDone((x)=>({...x,[item.lead_id]:r.task?.title||'تم إنشاء المهمة'}));
    }catch(e){setError(e instanceof Error?e.message:'ACTION_FAILED');}
    finally{setPending((x)=>{const n={...x};delete n[item.lead_id];return n;});}
  }

  return <ScrollView style={s.screen} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#c7ff5e"/>}>
    <Text style={s.kicker}>NEXT BEST ACTION</Text>
    <Text style={s.h}>الإجراء الأهم الآن</Text>
    <Text style={s.p}>كل تنفيذ يمر عبر Policy Guard + Tenant Scope + Idempotency + Event Audit. لا يتم إرسال رسالة أو خصم أو تغيير مرحلة تلقائيًا في هذه النسخة.</Text>
    {error?<View style={s.err}><Text style={s.errText}>{error}</Text></View>:null}
    {!items.length&&!loading?<Text style={s.empty}>لا توجد إجراءات حرجة الآن.</Text>:null}
    {items.map((item)=>{
      const isPending=!!pending[item.lead_id];
      const completed=done[item.lead_id];
      return <View style={[s.card,item.priority==='critical'&&s.critical]} key={`${item.lead_id}:${item.action}`}>
        <View style={s.headRow}><Text style={s.name}>{item.contact?.name||item.contact?.phone||'Lead'}</Text><Text style={s.score}>Score {item.score}</Text></View>
        <Text style={s.value}>{Number(item.estimated_value||0).toLocaleString('ar-SA')} {item.currency||'SAR'}</Text>
        <Text style={s.reason}>{item.reason}</Text>
        <Text style={s.meta}>{item.stage} • ركود {item.stagnation_hours} ساعة • {item.priority}</Text>
        <Pressable disabled={isPending||!!completed} onPress={()=>approve(item)} style={({pressed})=>[s.btn,(pressed||isPending)&&s.btnDown,completed&&s.btnDone]}>
          {isPending?<ActivityIndicator color="#071006"/>:<Text style={s.btnText}>{completed?'تم ✓':labelFor(item.action)}</Text>}
        </Pressable>
        {completed?<Text style={s.doneText}>{completed}</Text>:null}
      </View>
    })}
  </ScrollView>
}

const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#07090d'},content:{padding:20,paddingTop:70,paddingBottom:120},
  kicker:{color:'#c7ff5e',fontSize:12,fontWeight:'900',letterSpacing:1.4},h:{color:'#f5f7fb',fontSize:28,fontWeight:'900',marginTop:8},p:{color:'#8f9bad',marginTop:9,lineHeight:21,marginBottom:18,textAlign:'right'},
  card:{backgroundColor:'#0f131a',borderColor:'#26303d',borderWidth:1,borderRadius:20,padding:16,marginBottom:12},critical:{borderColor:'#674c20'},
  headRow:{flexDirection:'row',justifyContent:'space-between',gap:10},name:{color:'#f5f7fb',fontWeight:'800',fontSize:17,flex:1,textAlign:'right'},score:{color:'#c7ff5e',fontWeight:'800'},
  value:{color:'#f5f7fb',fontSize:24,fontWeight:'900',marginTop:10,textAlign:'right'},reason:{color:'#cbd5e1',marginTop:8,lineHeight:20,textAlign:'right'},meta:{color:'#7f8b9c',fontSize:11,marginTop:8,textAlign:'right'},
  btn:{backgroundColor:'#c7ff5e',paddingVertical:13,borderRadius:14,alignItems:'center',marginTop:14},btnDown:{opacity:.7},btnDone:{backgroundColor:'#8fbf4a'},btnText:{color:'#071006',fontWeight:'900'},doneText:{color:'#66e3a4',fontSize:11,marginTop:8,textAlign:'right'},
  err:{backgroundColor:'#211',borderColor:'#633',borderWidth:1,borderRadius:12,padding:12,marginBottom:12},errText:{color:'#f8b4b4'},empty:{color:'#8f9bad',padding:24,textAlign:'center'}
});
