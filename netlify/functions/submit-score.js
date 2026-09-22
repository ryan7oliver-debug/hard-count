// Accepts one daily score and adds it to that day's leaderboard.
//
// Storage is a single JSON blob per calendar day (Netlify Blobs, store "daily-scores"), holding an array of
// {name, score, position, opponent, ts}, sorted best-first, capped at MAX_KEPT. This is a read-modify-write:
// two people posting in the same instant could theoretically clobber each other (Netlify Blobs doesn't give
// us a transaction here). For a casual leaderboard among friends that's an acceptable trade against the
// complexity of real optimistic-concurrency retries — worth knowing if this ever needs to hold up under real
// concurrent traffic.
//
// There is also no server-side replay validation: a request with a plausible-looking score is trusted. This
// is an honor-system leaderboard, matching the rest of the project's casual, non-commercial posture.
import { getStore } from '@netlify/blobs';

const MAX_NAME = 24;
const MAX_KEPT = 200;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const date = String(body.date || '').slice(0, 10);
  const name = String(body.name || '').trim().slice(0, MAX_NAME) || 'Anonymous';
  const score = Number(body.score);
  const position = String(body.position || '').slice(0, 8);
  const opponent = String(body.opponent || '').slice(0, 40);

  if (!DATE_RE.test(date)) return new Response('Bad date', { status: 400 });
  if (!Number.isFinite(score) || score < 0 || score > 200) return new Response('Bad score', { status: 400 });

  const store = getStore('daily-scores');
  const entries = (await store.get(date, { type: 'json' })) || [];

  const entry = { name, score, position, opponent, ts: Date.now() };
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score || a.ts - b.ts);
  const trimmed = entries.slice(0, MAX_KEPT);

  await store.setJSON(date, trimmed);

  const rank = trimmed.findIndex((e) => e.ts === entry.ts) + 1;
  return new Response(JSON.stringify({ ok: true, rank: rank || null, total: trimmed.length }), {
    headers: { 'content-type': 'application/json' },
  });
};

export const config = { path: '/api/submit-score' };
