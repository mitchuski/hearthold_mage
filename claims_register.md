# Claims register

Every load-bearing claim gets a CR-id and a tier (GR-2). Prose elsewhere may
assert nothing that does not resolve to a CR-id here. Keystone-only writes;
other seats return proposed entries.

Tiers: **PROVEN** (executed here, re-runnable) · **DERIVED** (follows from a
PROVEN claim, derivation cited) · **REPORTED** (external, slug-cited via
SOURCES.md) · **OPEN** (must state what would settle it) · **MYTH**
(chronicles only).

| id | claim | tier | evidence | status |
|---|---|---|---|---|
| CR-1 | Baseline disclosure-debt is 2049 canonical bytes by the counting rule in frontier.json | PROVEN | frontier.json baseline.how; `node scripts/measure-disclosure.mjs --baseline`, run 2026-07-13 | accepted |
| CR-2 | The FULL-mode bundle satisfies every one of the 23 frozen census requirements (canary) | PROVEN | `node scripts/self-test.mjs` — canary 23/23; baseline-run | accepted |
| CR-3 | The gate can fail: each of 14 negative fixtures is refused by its target check, by name | PROVEN | `node scripts/self-test.mjs` — NEGATIVE section; baseline-run | accepted |
| CR-4 | The counting canonicalization is byte-identical to the harness κ (kappa.mjs) | PROVEN | `node scripts/measure-disclosure.mjs --self-test` | accepted |
| CR-5 | The baseline number reproduces across a fresh (stranger) issuer identity | PROVEN | two seeds → same count 2049 (frontier baseline.how) | accepted |
