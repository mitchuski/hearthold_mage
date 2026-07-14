# Census — FROZEN

The requirement census is the gate's vocabulary. Once frozen, any change to
`requirements.json` is a **new census version** and requires a **new baseline**
(re-measure) and a re-freeze — because the metric is only meaningful relative to
a fixed set of things a relying party may demand.

| field | value |
|---|---|
| file | `census/requirements.json` |
| N (entries) | **23** |
| sha256 | `89a25a1f77c7fa2984105d2e5d295170a77474f67986651f50fd5a59ad78e2ac` |
| frozen | 2026-07-13 |
| baseline it anchors | 2049 canonical bytes (frontier.json) |

Re-derive the hash:

```
node -e "console.log(require('crypto').createHash('sha256').update(require('fs').readFileSync('census/requirements.json')).digest('hex'))"
```

Every entry is **canary-satisfiable**: `scripts/self-test.mjs` proves the FULL-mode
bundle passes all 23 (the §0 design law — a requirement the canary cannot meet
makes the feasible set empty). Provenance and the absence claims are documented in
`census/DESIGN.md`.
