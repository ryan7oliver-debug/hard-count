import { getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';

const MAX_BYTES = 2_000_000;   // a career save is a few KB in practice; this is just a sanity cap

export default async (req) => {
  const user = await getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const store = getStore('career-saves');
  if (req.method === 'GET') {
    const save = await store.get(user.id, { type: 'json' });
    return new Response(JSON.stringify({ save: save || null }), {
      headers: { 'content-type': 'application/json' },
    });
  }
  if (req.method === 'POST') {
    const text = await req.text();
    if (text.length > MAX_BYTES) return new Response('Too large', { status: 413 });
    let body;
    try { body = JSON.parse(text); } catch { return new Response('Bad JSON', { status: 400 }); }
    if (body && body.clear) {
      await store.delete(user.id);
      return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
    }
    await store.setJSON(user.id, body);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }
  return new Response('Method not allowed', { status: 405 });
};
export const config = { path: '/api/career-save' };
