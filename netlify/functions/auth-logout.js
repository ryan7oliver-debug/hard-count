import { logout, verifyRequestOrigin } from '@netlify/identity';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try { verifyRequestOrigin(req); } catch (e) {
    return new Response(JSON.stringify({ error: 'Request rejected.' }), {
      status: e.status || 403, headers: { 'content-type': 'application/json' },
    });
  }
  try { await logout(); } catch { /* already logged out */ }
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
export const config = { path: '/api/auth-logout' };
