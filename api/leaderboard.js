const KEY = 'turnover:3d:scores';
const TOP_N = 10;
const MAX_NAME = 14;
// A perfect run tops out well under this; anything above is a forged POST.
const MAX_SCORE = 5_000_000;

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  const res = await fetch(REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error || `redis ${res.status}`);
  return body.result;
}

function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  // Strip control chars so a name can't smuggle markup or newlines into the board.
  const name = Array.from(raw)
    .filter((ch) => { const c = ch.codePointAt(0); return c > 31 && c !== 127; })
    .join('')
    .trim()
    .slice(0, MAX_NAME);
  return name || null;
}

async function topScores() {
  const flat = await redis(['ZRANGE', KEY, '0', String(TOP_N - 1), 'REV', 'WITHSCORES']);
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    out.push({ name: flat[i], score: Number(flat[i + 1]) });
  }
  return out;
}

export default async function handler(req, res) {
  if (!REST_URL || !REST_TOKEN) {
    return res.status(503).json({ error: 'leaderboard storage not configured' });
  }

  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
      return res.status(200).json({ scores: await topScores() });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const name = cleanName(body.name);
      const score = Math.floor(Number(body.score));

      if (!name) return res.status(400).json({ error: 'name required' });
      if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
        return res.status(400).json({ error: 'invalid score' });
      }

      // GT keeps each player's personal best instead of their most recent run.
      await redis(['ZADD', KEY, 'GT', String(score), name]);
      return res.status(200).json({ scores: await topScores() });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('leaderboard failed:', err);
    return res.status(500).json({ error: 'leaderboard unavailable' });
  }
}
