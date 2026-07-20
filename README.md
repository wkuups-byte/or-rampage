# TURNOVER 🏥💥

OR turnover stress-relief game. Smash the operating suite, run up the damage bill, dodge the janitor.

## Play

- **3D first-person** — `index.html` (site root; also at `turnover-3d.html`). Desktop pointer-lock; mobile touch controls auto-detect, `?touch=1` to force.
- **2D top-down** — `2d.html`

## Leaderboard

The 3D death screen posts to `/api/leaderboard` (Vercel function, `api/leaderboard.js`), backed by an
Upstash Redis sorted set. `GET` returns the top 10; `POST {name, score}` keeps each name's personal best
(`ZADD … GT`). Names are capped at 14 chars, scores above `MAX_SCORE` are rejected.

Needs `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or the `UPSTASH_REDIS_REST_*` equivalents) in the Vercel
project. Without them the endpoint returns 503 and the game shows "leaderboard offline" — play is unaffected.

## Structure

Both games are single self-contained HTML files (Three.js 0.147 UMD inlined in the 3D build — no external deps, no build step).

`src3d/` holds the 3D sources; reassemble with:

```sh
npm i three@0.147.0
cat src3d/part1.html node_modules/three/build/three.min.js src3d/mid.txt src3d/game3d.js src3d/tail.txt > turnover-3d.html
```
