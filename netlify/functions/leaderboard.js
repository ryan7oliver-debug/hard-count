// Returns the top scores for a given calendar day. Read-only counterpart to submit-score.js.
import { getStore } from '@netlify/blobs';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async (req) => {
  const url = new URL(req.url);
  const date = String(url.searchParams.get('date') || '').slice(0, 10);
  if (!DATE_RE.test(date)) return new Response('Bad date', { status: 400 });

  const store = getStore('daily-scores');
  const entries = (await store.get(date, { type: 'json' })) || [];
  const top = entries.slice(0, 50);

  return new Response(JSON.stringify({ date, entries: top, total: entries.length }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=15' },
  });
};

export const config = { path: '/api/leaderboard' };
