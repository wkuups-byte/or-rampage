# TURNOVER 🏥💥

OR turnover stress-relief game. Smash the operating suite, run up the damage bill, dodge the janitor.

## Play

- **3D first-person** — `index.html` (site root; also at `turnover-3d.html`). Desktop pointer-lock; mobile touch controls auto-detect, `?touch=1` to force.
- **2D top-down** — `2d.html`

## Structure

Both games are single self-contained HTML files (Three.js 0.147 UMD inlined in the 3D build — no external deps, no build step).

`src3d/` holds the 3D sources; reassemble with:

```sh
npm i three@0.147.0
cat src3d/part1.html node_modules/three/build/three.min.js src3d/mid.txt src3d/game3d.js src3d/tail.txt > turnover-3d.html
```
