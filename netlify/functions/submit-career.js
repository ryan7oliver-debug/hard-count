import { getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';

const MAX_KEPT = 100;
const MODES = ['player', 'coach'];

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const user = await getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  const mode = String(body.mode || '');
  if (!MODES.includes(mode)) return new Response('Bad mode', { status: 400 });
  const score = Number(body.score);
  if (!Number.isFinite(score) || score < -500 || score > 2000) return new Response('Bad score', { status: 400 });
  const headline = String(body.headline || '').slice(0, 60);
  const record = String(body.record || '').slice(0, 20);
  const detail = String(body.detail || '').slice(0, 60);

  const profileStore = getStore('profiles');
  const profile = await profileStore.get(user.id, { type: 'json' });
  const name = (profile && profile.name) || (user.email ? user.email.split('@')[0] : 'Anonymous');

  const careerStore = getStore('career-scores');
  const entries = (await careerStore.get(mode, { type: 'json' })) || [];
  const prior = entries.find((e) => e.userId === user.id);
  // keep each account's single best finish -- a worse run never bumps a better one off the board
  const list = (!prior || score > prior.score)
    ? entries.filter((e) => e.userId !== user.id).concat([{ userId: user.id, name, score, headline, record, detail, ts: Date.now() }])
    : entries;
  list.sort((a, b) => b.score - a.score || a.ts - b.ts);
  const trimmed = list.slice(0, MAX_KEPT);
  await careerStore.setJSON(mode, trimmed);
  const rank = trimmed.findIndex((e) => e.userId === user.id) + 1;
  return new Response(JSON.stringify({ ok: true, rank: rank || null, total: trimmed.length }), {
    headers: { 'content-type': 'application/json' },
  });
};
export const config = { path: '/api/submit-career' };
