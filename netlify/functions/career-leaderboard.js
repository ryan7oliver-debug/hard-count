import { getStore } from '@netlify/blobs';

const MODES = ['player', 'coach'];

export default async (req) => {
  const url = new URL(req.url);
  const mode = String(url.searchParams.get('mode') || '');
  if (!MODES.includes(mode)) return new Response('Bad mode', { status: 400 });
  const store = getStore('career-scores');
  const entries = (await store.get(mode, { type: 'json' })) || [];
  const top = entries.slice(0, 50).map(({ name, score, headline, record, detail }) => ({ name, score, headline, record, detail }));
  return new Response(JSON.stringify({ mode, entries: top, total: entries.length }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=15' },
  });
};
export const config = { path: '/api/career-leaderboard' };
