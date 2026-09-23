import { login, verifyRequestOrigin } from '@netlify/identity';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try { verifyRequestOrigin(req); } catch (e) {
    return new Response(JSON.stringify({ error: 'Request rejected.' }), {
      status: e.status || 403, headers: { 'content-type': 'application/json' },
    });
  }
  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  const email = String(body.email || '').trim();
  const password = String(body.password || '');
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required.' }), {
      status: 400, headers: { 'content-type': 'application/json' },
    });
  }
  try {
    const user = await login(email, password);
    return new Response(JSON.stringify({ ok: true, email: user.email }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Could not log in. Check your email and password.' }), {
      status: 401, headers: { 'content-type': 'application/json' },
    });
  }
};
export const config = { path: '/api/auth-login' };
