import { getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';

const MAX_NAME = 24;

export default async (req) => {
  const user = await getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const store = getStore('profiles');
  if (req.method === 'GET') {
    const profile = await store.get(user.id, { type: 'json' });
    return new Response(JSON.stringify({ name: profile ? profile.name : null }), {
      headers: { 'content-type': 'application/json' },
    });
  }
  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
    const name = String(body.name || '').trim().slice(0, MAX_NAME);
    if (!name) return new Response('Bad name', { status: 400 });
    await store.setJSON(user.id, { name });
    return new Response(JSON.stringify({ ok: true, name }), {
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response('Method not allowed', { status: 405 });
};
export const config = { path: '/api/profile' };
