import { signup, verifyRequestOrigin } from '@netlify/identity';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try { verifyRequestOrigin(req); } catch (e) {
    return new Response(JSON.stringify({ error: 'Request rejected.' }), {
      status: e.status || 403, headers: { 'content-type': 'application/json' },
    });
  }
  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  const email = String(body.email || '').trim().slice(0, 254);
  const password = String(body.password || '');
  const name = String(body.name || '').trim().slice(0, 24);
  if (!email || password.length < 8) {
    return new Response(JSON.stringify({ error: 'Email and an 8+ character password are required.' }), {
      status: 400, headers: { 'content-type': 'application/json' },
    });
  }
  try {
    const user = await signup(email, password, name ? { full_name: name } : undefined);
    // Always send the client back to log in explicitly next, rather than guessing whether this
    // site's Identity settings auto-confirm and auto-log-in — logging in again right after is harmless.
    return new Response(JSON.stringify({ ok: true, email: user.email, pending: true }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Could not sign up.' }), {
      status: 400, headers: { 'content-type': 'application/json' },
    });
  }
};
export const config = { path: '/api/auth-signup' };
