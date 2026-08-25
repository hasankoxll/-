import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const URL='https://ittixiicaeizihyzawju.supabase.co';
const KEY='sb_publishable_SIlfF6-ctdJL2WTg3eTlKQ_5F3LKsSl';
const sb=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
let busy=false,lastLink=null;

const style=document.createElement('style');
style.textContent=`
#paymentLinkTools{margin-top:22px}.paylink-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.paylink-grid label{display:grid;gap:8px;color:#9fb1b5;font-size:13px}.paylink-grid select{width:100%;min-height:48px;border:1px solid #29424b;border-radius:12px;background:#0d1b21;color:#eef7f4;padding:0 12px}.paylink-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.paylink-actions button,.paylink-actions a{border:0;border-radius:12px;padding:12px 16px;background:#69dfb4;color:#071217;font-weight:800;text-decoration:none;cursor:pointer}.paylink-actions .secondary{background:#162a31;color:#dce7e8;border:1px solid #2d4650}.paylink-result{margin-top:14px;padding:14px;border:1px solid #29424b;border-radius:14px;background:#0a1820;word-break:break-all;color:#b8c8cc}.paylink-status{margin-top:10px;color:#91a4aa;font-size:13px}.paylink-status.ok{color:#79e0b8}.paylink-status.err{color:#ff9ca3}@media(max-width:720px){.paylink-grid{grid-template-columns:1fr}}
`;
document.head.appendChild(style);

async function session(){return (await sb.auth.getSession()).data.session}
function card(){return `<div id="paymentLinkTools" class="card form-card action-card"><h2>رابط دفع العميل</h2><p>أنشئ رابطًا عامًا مؤقتًا. العميل يفتحه من واتساب أو البريد بدون تسجيل دخول إلى Vaultify.</p><div class="paylink-grid"><label>الباقة<select id="payPlan"><option value="standard">Standard</option><option value="growth">Growth</option><option value="custom">Custom</option></select></label><label>نوع التحصيل<select id="payType"><option value="setup_plus_monthly">التأسيس + أول شهر</option><option value="setup">التأسيس فقط</option><option value="monthly">الاشتراك الشهري فقط</option></select></label></div><div class="paylink-actions"><button id="generatePayLink" type="button">إنشاء رابط دفع آمن</button></div><div id="payLinkStatus" class="paylink-status"></div><div id="payLinkResult"></div></div>`}
function inject(){
 const billing=document.getElementById('billing'); if(!billing||!billing.classList.contains('active'))return;
 const stale=[...billing.querySelectorAll('.sub')].find(x=>x.textContent.includes('مزود الدفع الفعلي هو الجزء الخارجي المتبقي'));
 if(stale)stale.textContent='الدفع مربوط حاليًا مع Moyasar Sandbox عبر رابط عام موقّع ومستقل عن جلسة تسجيل الدخول.';
 if(!document.getElementById('paymentLinkTools'))billing.insertAdjacentHTML('beforeend',card());
}
async function generate(){
 if(busy)return; busy=true; const btn=document.getElementById('generatePayLink'),status=document.getElementById('payLinkStatus'),result=document.getElementById('payLinkResult');
 btn.disabled=true;status.className='paylink-status';status.textContent='جارٍ إنشاء Payment Intent والرابط العام…';result.innerHTML='';
 try{
  const s=await session(); if(!s)throw new Error('انتهت جلسة الدخول');
  const plan_id=document.getElementById('payPlan').value,charge_type=document.getElementById('payType').value;
  const r=await fetch(`${URL}/functions/v1/moyasar-create-checkout`,{method:'POST',headers:{Authorization:`Bearer ${s.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({plan_id,charge_type})});
  const j=await r.json().catch(()=>({})); if(!r.ok||!j.checkout_url)throw new Error(j.error||`HTTP ${r.status}`);
  lastLink=j.checkout_url; const amount=new Intl.NumberFormat('ar-SA').format(Number(j.plan?.amount||0));
  result.innerHTML=`<div class="paylink-result"><b>${j.plan?.name||plan_id}</b> · ${amount} ${j.plan?.currency||'SAR'}<br><span>${lastLink}</span><br><small>ينتهي: ${new Date(j.expires_at).toLocaleString('ar-SA')}</small></div><div class="paylink-actions"><button type="button" id="copyPayLink">نسخ الرابط</button><a class="secondary" id="openPayLink" target="_blank" rel="noopener">فتح كعميل</a><a class="secondary" id="waPayLink" target="_blank" rel="noopener">إرسال عبر واتساب</a><a class="secondary" id="mailPayLink">إرسال بالبريد</a></div>`;
  document.getElementById('openPayLink').href=lastLink;
  const msg=`رابط الدفع الآمن من Vaultify:\n${lastLink}\nالرابط مؤقت وينتهي تلقائيًا.`;
  document.getElementById('waPayLink').href=`https://wa.me/?text=${encodeURIComponent(msg)}`;
  document.getElementById('mailPayLink').href=`mailto:?subject=${encodeURIComponent('Vaultify - رابط الدفع')}&body=${encodeURIComponent(msg)}`;
  status.className='paylink-status ok';status.textContent='تم إنشاء الرابط. لا يحتاج العميل إلى تسجيل الدخول.';
 }catch(e){status.className='paylink-status err';status.textContent='تعذر إنشاء الرابط: '+e.message}
 finally{busy=false;btn.disabled=false}
}
document.addEventListener('click',async e=>{
 const id=e.target?.id;
 if(id==='generatePayLink')return generate();
 if(id==='copyPayLink'&&lastLink){try{await navigator.clipboard.writeText(lastLink);const s=document.getElementById('payLinkStatus');s.className='paylink-status ok';s.textContent='تم نسخ رابط الدفع.'}catch{}}
});
new MutationObserver(()=>inject()).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
document.addEventListener('click',e=>{if(e.target.closest('button[data-view="billing"]'))setTimeout(inject,0)});
setTimeout(inject,500);
