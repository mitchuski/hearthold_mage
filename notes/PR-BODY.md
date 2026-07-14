# PR title

`The House of Archon takes the seat — disclosure-debt, signed`

# PR body (paste below)

---

## The seat is filled

Per `SLOT.md` and `ADOPTION.md` Part II: the five answers are written into `harness.config.mjs`, the Gap is defined, and `conform` accepts the instance. The acceptance is signed by the Sovereign and anchored on Archon:

| Artifact | DID |
|---|---|
| **Seat acceptance** (signed, also committed as `acceptance.signed.json`) | `did:cid:bagaaieracsu3rpuodyrfzvpgvjejgc7dcogpepty3etlpkz4q5rm3nu2bslq` |
| **Workshop genesis Ruleset** (the law the acceptance cites; `notes/workshop-ruleset-v1.signed.json`) | `did:cid:bagaaieraazdjnafzgkl2jj4od4px7ubd2x6y7rlwdkhxjw7wyzdmqeqyny5a` |

**Objective:** disclosure-debt — canonical-JSON byte count of the ATTESTATION disclosure bundle satisfying the frozen relying-party census, ↓. *The number that shrinks is what leaves the house.*
**Bound bytes:** `harness.config.mjs` @ `sha256:16a3f899f4917ebfe24d239fc0074e5e5dcf382cf265f6fa01f46ebdf6cb1f90` · census @ `sha256:89a25a1f77c7fa2984105d2e5d295170a77474f67986651f50fd5a59ad78e2ac` (N=23, 4 absence claims).
**Baseline = best = 2049** (registry: `local`; reproduced cross-identity; pinned by `conformChecks`).
**Seating:** V60 accepted as proposed — the hearth burns care, not compute. The identity direction is embraced as the horizon (see `acceptance.json.statement`); per your own #9 lesson, did:cid resolution integrity is taken as an **auditor**, not a harness.

## Verify it yourself (nothing here asks for trust)

```
node ../dual-agent-harness/engine/conform.mjs .        # instance conforms, baseline pin live
node scripts/self-test.mjs                             # canary 23/23 · 14 negatives refused by name · REGISTRY: all local
sha256sum harness.config.mjs census/requirements.json  # 16a3f899… · 89a25a1f…
# the signatures: resolve either DID on Archon; proof verifies against did:cid:…lgfe4sa (the Sovereign)
```

IPFS pin: `<CID + add params — fill after ipfs add --cid-version=1 acceptance.signed.json>` — please re-derive from the committed file before pinning (L5: never trusted, only re-derived).

## What's in the change

- `census/` — the frozen relying-party requirement census (+ `DESIGN.md` provenance incl. three §0 catches, `FROZEN.md`)
- `scripts/` — seed (deterministic, `registry:'local'`, fail-loud), measure (κ-byte-match self-test), the zero-dep relying-party gate, self-test, fixture cleanup
- `harness.config.mjs` — the five answers + the baseline `conformChecks` pin
- `frontier.json`, ledgers, `manifest.yaml` — baseline recorded, coherence edits
- `acceptance.json` / `acceptance.signed.json`, `notes/workshop-ruleset-v1{,.signed}.json` — the signature trail
- `runs/baseline/bundle.json` — **force-added past `runs/*` gitignore**: it's the evidence `frontier.json` cites, and an audit trail that doesn't ship is the defect we found in your `console.test.mjs` (below)
- `README.md` — "the seat is empty on purpose" section updated to reflect the filled seat *(suggested edit riding this PR)*

## Two findings from the road in (filed with the rules they touch)

1. **`tools/console.test.mjs` fails on a fresh clone** — it reads `examples/field-guide/runs/r3/r3.1/p2-telegraphic-bullets-second-draw/proposal_canon.json`, which `runs/*` gitignore strips. Two independent confirmations (ENOENT on fresh checkout; root cause in the ignore rules). Suggested fix: commit the r3 fixture (your audit story wants those bytes public — "anyone, at any later date") or a GR-5 "not reached / not recorded" skip when absent.
2. **The `conformChecks` example shape** — the config template's comment implies a boolean/string return; `conform.mjs`'s real contract is an array of error strings. We matched the real contract; the doc example may want aligning.

## What happens on merge

`HARNESS_PATHS.md` #11 (skeleton repo) flips *invited → seated* — proposed row below, yours to apply or take as a PR there. First spar to follow; its verdict will be the first artifact of the duel tier (Warden-sealed, offline-verifiable — the "formal runtime to come," if you want it).

Proposed catalogue row:

```
| hearthold | household sovereignty stack | disclosure-debt: canonical bytes of the census-satisfying disclosure bundle, ↓ | 8 requirement-ids drawn from a frozen 23-entry census by hashing the proposal | mechanically fitted — seated 2026-07-14, signed (did:cid:…nu2bslq); first spar pending |
```

T4, completed: you held the seat open with a gate that refused to pass; we answer with a signature anyone can check. The hearth burns care, not compute. 🗝️🏰

---
