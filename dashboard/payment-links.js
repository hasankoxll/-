import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const URL='https://ittixiicaeizihyzawju.supabase.co';
const KEY='sb_publishable_SIlfF6-ctdJL2WTg3eTlKQ_5F3LKsSl';
const sb=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
let busy=false,lastLink=null,lastIntentId=null,pollTimer=null,lastData=null;

const style=document.createElement('style');
style.textContent=`
#paymentLinkTools{margin-top:22px}.paylink-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.env-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;border:1px solid #6c5d2f;background:#2a2412;color:#ffe49a;font-size:12px;font-weight:800}.env-dot{width:8px;height:8px;border-radius:50%;background:#ffd782;box-shadow:0 0 14px #ffd782}.paylink-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}.paylink-grid label{display:grid;gap:8px;color:#9fb1b5;font-size:13px}.paylink-grid select{width:100%;min-height:48px;border:1px solid #29424b;border-radius:12px;background:#0d1b21;color:#eef7f4;padding:0 12px}.paylink-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.paylink-actions button,.paylink-actions a{border:0;border-radius:12px;padding:12px 16px;background:#69dfb4;color:#071217;font-weight:800;text-decoration:none;cursor:pointer}.paylink-actions button:disabled{opacity:.55;cursor:not-allowed}.paylink-actions .secondary{background:#162a31;color:#dce7e8;border:1px solid #2d4650}.paylink-result{margin-top:14px;padding:14px;border:1px solid #29424b;border-radius:14px;background:#0a1820;word-break:break-all;color:#b8c8cc}.paylink-status{margin-top:10px;color:#91a4aa;font-size:13px}.paylink-status.ok{color:#79e0b8}.paylink-status.err{color:#ff9ca3}.paylink-status.warn{color:#ffd782}.paylink-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:18px}.paylink-kpi{padding:12px;border:1px solid #29424b;border-radius:13px;background:#0b1920}.paylink-kpi span{display:block;color:#82979d;font-size:11px}.paylink-kpi b{display:block;margin-top:4px;color:#eef7f4;font-size:19px}.history-title{display:flex;align-items:center;justify-content:space-between;margin:24px 0 10px}.history-title h3{margin:0;font-size:17px}.history-title small{color:#71868d}.intent-list{display:grid;gap:9px}.intent-row{display:grid;grid-template-columns:1.1fr .9fr .7fr .8fr;gap:10px;align-items:center;padding:13px;border:1px solid #263f48;border-radius:14px;background:#0a171d}.intent-main b{display:block}.intent-main small,.intent-cell small{display:block;color:#7e9298;margin-top:4px}.intent-cell{color:#c8d4d7}.status-chip{display:inline-flex;padding:6px 9px;border-radius:999px;font-size:11px;font-weight:850;border:1px solid #35505a;background:#13242b}.status-chip.paid{border-color:#2e8b68;background:#0d2c22;color:#8af0c5}.status-chip.initiated{border-color:#71652d;background:#292512;color:#ffe58e}.status-chip.created{border-color:#31556a;background:#102532;color:#9ad9ff}.status-chip.expired,.status-chip.failed,.status-chip.cancelled{border-color:#704047;background:#29171c;color:#ffafb5}.paylink-note{margin-top:12px;color:#71868d;font-size:12px;line-height:1.7}@media(max-width:720px){.paylink-grid{grid-template-columns:1fr}.paylink-kpis{grid-template-columns:1fr 1fr}.intent-row{grid-template-columns:1fr 1fr}.paylink-head{display:block}.env-badge{margin-top:10px}}
`;
document.head.appendChild(style);

async function session(){return (await sb.auth.getSession()).data.session}
const money=(n,c='SAR')=>`${new Intl.NumberFormat('ar-SA',{maximumFractionDigits:0}).format(Number(n||0))} ${c}`;
const dt=x=>x?new Date(x).toLocaleString('ar-SA'):'—';
function effectiveStatus(x){if(['created','initiated'].includes(x.status)&&x.expires_at&&new Date(x.expires_at).getTime()<=Date.now())return'expired';return x.status}
function labelStatus(s){return({created:'لم يُفتح',initiated:'بانتظار الدفع',paid:'مدفوع',failed:'فشل',expired:'منتهي',cancelled:'ملغي'})[s]||s}
function chargeLabel(s){return({setup_plus_monthly:'التأسيس + أول شهر',setup:'التأسيس فقط',monthly:'الاشتراك الشهري'})[s]||s}
function card(){return `<div id="paymentLinkTools" class="card form-card action-card"><div class="paylink-head"><div><h2 style="margin:0">روابط دفع العملاء</h2><p>أنشئ رابطًا عامًا موقّعًا ومؤقتًا. العميل يفتحه من واتساب أو البريد بدون تسجيل دخول إلى Vaultify.</p></div><span class="env-badge"><span class="env-dot"></span>Moyasar Sandbox</span></div><div id="payKpis" class="paylink-kpis"></div><div class="paylink-grid"><label>الباقة<select id="payPlan"></select></label><label>نوع التحصيل<select id="payType"><option value="setup_plus_monthly">التأسيس + أول شهر</option><option value="setup">التأسيس فقط</option><option value="monthly">الاشتراك الشهري فقط</option></select></label></div><div class="paylink-actions"><button id="generatePayLink" type="button">إنشاء رابط دفع آمن</button><button id="refreshPayStatus" class="secondary" type="button">تحديث الحالات</button></div><div id="payLinkStatus" class="paylink-status">جارٍ تحميل حالة الدفع…</div><div id="payLinkResult"></div><div class="history-title"><h3>آخر روابط الدفع</h3><small id="payLastRefresh">—</small></div><div id="paymentIntentHistory" class="intent-list"></div><div class="paylink-note">الحماية الحالية: الأسعار تُحسب في الخادم، الرابط مؤقت، الرمز الخام لا يُخزن في قاعدة البيانات، وفتح الرابط أكثر من مرة يعيد استخدام نفس فاتورة Moyasar.</div></div>`}
function inject(){
 const billing=document.getElementById('billing'); if(!billing||!billing.classList.contains('active'))return;
 const stale=[...billing.querySelectorAll('.sub')].find(x=>x.textContent.includes('مزود الدفع الفعلي هو الجزء الخارجي المتبقي'));
 if(stale)stale.textContent='بوابة الدفع مربوطة ومختبرة End-to-End في Moyasar Sandbox. الانتقال للإنتاج سيظل مقفلاً حتى اعتماد مفاتيح Live واختبار الجاهزية.';
 if(!document.getElementById('paymentLinkTools')){billing.insertAdjacentHTML('beforeend',card());refreshData(true)}
}
function renderPlans(plans=[]){const el=document.getElementById('payPlan');if(!el)return;const current=el.value;el.innerHTML=plans.map(p=>`<option value="${p.id}">${p.name} — تأسيس ${money(p.setup_fee,p.currency)} / شهري ${money(p.monthly_fee,p.currency)}</option>`).join('');if(current&&plans.some(p=>p.id===current))el.value=current}
function renderKpis(intents=[]){const ks=intents.map(x=>effectiveStatus(x));const total=intents.length,waiting=ks.filter(x=>x==='created'||x==='initiated').length,paid=ks.filter(x=>x==='paid').length,expired=ks.filter(x=>x==='expired').length;const el=document.getElementById('payKpis');if(el)el.innerHTML=`<div class="paylink-kpi"><span>آخر الروابط</span><b>${total}</b></div><div class="paylink-kpi"><span>بانتظار العميل</span><b>${waiting}</b></div><div class="paylink-kpi"><span>مدفوعة</span><b>${paid}</b></div><div class="paylink-kpi"><span>منتهية</span><b>${expired}</b></div>`}
function renderHistory(intents=[]){const el=document.getElementById('paymentIntentHistory');if(!el)return;if(!intents.length){el.innerHTML='<div class="paylink-result">لا توجد روابط دفع منشأة بعد.</div>';return}el.innerHTML=intents.map(x=>{const s=effectiveStatus(x);return `<div class="intent-row"><div class="intent-main"><b>${x.plan_id}</b><small>${chargeLabel(x.charge_type)}</small></div><div class="intent-cell"><b>${money(x.amount,x.currency)}</b><small>${dt(x.created_at)}</small></div><div class="intent-cell"><span class="status-chip ${s}">${labelStatus(s)}</span><small>${x.opened_at?'فُتح من العميل':'لم يُفتح بعد'}</small></div><div class="intent-cell"><b>${x.provider_reference?`#${x.provider_reference}`:'—'}</b><small>ينتهي ${dt(x.expires_at)}</small></div></div>`}).join('')}
async function refreshData(silent=false){const status=document.getElementById('payLinkStatus');try{const s=await session();if(!s)throw new Error('انتهت جلسة الدخول');if(!silent&&status){status.className='paylink-status';status.textContent='جارٍ تحديث الحالات…'}const r=await fetch(`${URL}/functions/v1/dashboard-data`,{headers:{Authorization:`Bearer ${s.access_token}`}});const j=await r.json();if(!r.ok)throw new Error(j.error||`HTTP ${r.status}`);lastData=j;renderPlans(j.plans||[]);renderKpis(j.payment_intents||[]);renderHistory(j.payment_intents||[]);const t=document.getElementById('payLastRefresh');if(t)t.textContent=`آخر تحديث ${new Date().toLocaleTimeString('ar-SA')}`;if(!silent&&status){status.className='paylink-status ok';status.textContent='تم تحديث حالات الدفع.'}}catch(e){if(status){status.className='paylink-status err';status.textContent='تعذر تحديث حالات الدفع: '+e.message}}}
async function generate(){
 if(busy)return; busy=true; const btn=document.getElementById('generatePayLink'),status=document.getElementById('payLinkStatus'),result=document.getElementById('payLinkResult');
 btn.disabled=true;status.className='paylink-status';status.textContent='جارٍ إنشاء Payment Intent والرابط العام…';result.innerHTML='';
 try{
  const s=await session(); if(!s)throw new Error('انتهت جلسة الدخول');
  const plan_id=document.getElementById('payPlan').value,charge_type=document.getElementById('payType').value;
  if(!plan_id)throw new Error('لا توجد باقة فعالة');
  const r=await fetch(`${URL}/functions/v1/moyasar-create-checkout`,{method:'POST',headers:{Authorization:`Bearer ${s.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({plan_id,charge_type})});
  const j=await r.json().catch(()=>({})); if(!r.ok||!j.checkout_url)throw new Error(j.error||`HTTP ${r.status}`);
  lastLink=j.checkout_url;lastIntentId=j.intent_id; const amount=new Intl.NumberFormat('ar-SA').format(Number(j.plan?.amount||0));
  result.innerHTML=`<div class="paylink-result"><b>${j.plan?.name||plan_id}</b> · ${amount} ${j.plan?.currency||'SAR'}<br><span>${lastLink}</span><br><small>ينتهي: ${new Date(j.expires_at).toLocaleString('ar-SA')}</small></div><div class="paylink-actions"><button type="button" id="copyPayLink">نسخ الرابط</button><a class="secondary" id="openPayLink" target="_blank" rel="noopener">فتح كعميل</a><a class="secondary" id="waPayLink" target="_blank" rel="noopener">إرسال عبر واتساب</a><a class="secondary" id="mailPayLink">إرسال بالبريد</a></div>`;
  document.getElementById('openPayLink').href=lastLink;
  const msg=`رابط الدفع الآمن من Vaultify:\n${lastLink}\nالرابط مؤقت وينتهي تلقائيًا.`;
  document.getElementById('waPayLink').href=`https://wa.me/?text=${encodeURIComponent(msg)}`;
  document.getElementById('mailPayLink').href=`mailto:?subject=${encodeURIComponent('Vaultify - رابط الدفع')}&body=${encodeURIComponent(msg)}`;
  status.className='paylink-status ok';status.textContent='تم إنشاء الرابط. الحالة: لم يُفتح من العميل بعد.';
  await refreshData(true);
 }catch(e){status.className='paylink-status err';status.textContent='تعذر إنشاء الرابط: '+e.message}
 finally{busy=false;btn.disabled=false}
}
document.addEventListener('click',async e=>{
 const id=e.target?.id;
 if(id==='generatePayLink')return generate();
 if(id==='refreshPayStatus')return refreshData(false);
 if(id==='copyPayLink'&&lastLink){try{await navigator.clipboard.writeText(lastLink);const s=document.getElementById('payLinkStatus');s.className='paylink-status ok';s.textContent='تم نسخ رابط الدفع.'}catch{}}
});
new MutationObserver(()=>inject()).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
document.addEventListener('click',e=>{if(e.target.closest('button[data-view="billing"]'))setTimeout(()=>{inject();refreshData(true)},0)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&document.getElementById('paymentLinkTools'))refreshData(true)});
function startPolling(){if(pollTimer)return;pollTimer=setInterval(()=>{const b=document.getElementById('billing');if(b?.classList.contains('active')&&!document.hidden)refreshData(true)},8000)}
setTimeout(()=>{inject();startPolling()},500);
