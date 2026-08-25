export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).send('Method Not Allowed');
  }

  const source = req.method === 'GET' ? req.query : req.body;
  const email = String(source?.email || '').trim().toLowerCase();
  const debug = String(source?.debug || '') === '1';

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    if (debug) return res.status(400).json({ ok:false, stage:'validate_email', code:'invalid_email' });
    return res.redirect(302, '/login-v2.html?error=invalid_email');
  }

  const SUPABASE_URL = 'https://ittixiicaeizihyzawju.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_SIlfF6-ctdJL2WTg3eTlKQ_5F3LKsSl';
  const redirectTo = 'https://vaultify-whatsapp-connect.vercel.app/dashboard/';

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': PUBLISHABLE_KEY,
        'Authorization': `Bearer ${PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({ email, create_user: true })
    });

    const text = await r.text();
    if (debug) {
      let parsed = null;
      try { parsed = text ? JSON.parse(text) : null; } catch {}
      return res.status(r.ok ? 200 : r.status).json({ ok:r.ok, status:r.status, body:parsed ?? text });
    }

    if (!r.ok) {
      console.error('Supabase OTP error', r.status, text);
      return res.redirect(302, `/login-v2.html?error=send_failed&status=${r.status}`);
    }

    return res.redirect(302, '/login-v2.html?sent=1');
  } catch (e) {
    if (debug) return res.status(500).json({ ok:false, stage:'fetch', error:String(e?.message || e) });
    console.error('Magic link send exception', e);
    return res.redirect(302, '/login-v2.html?error=network');
  }
}
