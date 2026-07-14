# Ceremony state — SIGNED ✅ (2026-07-14)

**THE SEAT IS SIGNED.** Both artifacts anchored, resolved, and cryptographically verified by GenitriX (proofs valid; signer = the Sovereign `did:cid:…lgfe4sa`; hashes re-derived against the working tree at verification time; law signed 16:14:44Z, acceptance 16:21:09Z):

- **Workshop Ruleset (the law):** `did:cid:bagaaieraazdjnafzgkl2jj4od4px7ubd2x6y7rlwdkhxjw7wyzdmqeqyny5a`
- **Seat acceptance:** `did:cid:bagaaieracsu3rpuodyrfzvpgvjejgc7dcogpepty3etlpkz4q5rm3nu2bslq`

**Remaining:** dual-pin (send PrivacyMage the signed acceptance file for his CID pin) · branch + commit → PR to `mitchuski/hearthold_mage` (body: both DIDs, both hashes, baseline 2049, the two findings) · his merge flips *invited → seated*, T4 complete · then the queued Lexon experiment.

---
*(Pre-signature state below, kept for the chronicle.)*

## Verified-frozen facts (recomputed by GenitriX, not trusted)

- `sha256(harness.config.mjs)` = `16a3f899f4917ebfe24d239fc0074e5e5dcf382cf265f6fa01f46ebdf6cb1f90` — recompute at sign time; any edit changes it
- census `89a25a1f77c7fa2984105d2e5d295170a77474f67986651f50fd5a59ad78e2ac`, N=23, frozen
- baseline = best = **2049** (local-registry path, cross-identity reproduced); conformChecks pin live; conform PASS
- `local` registry live on flaxlap; seed fail-loud non-local; REGISTRY self-test green; 6 hyperswarm fixtures revoked

## Files staged

- `acceptance.json` (repo root) — **two edits at sign time:** paste `workshopRulesetDid`, correct `date`
- `notes/workshop-ruleset-v1.json` — the genesis Ruleset draft to sign
- Working tree uncommitted (repo is mitchuski/hearthold_mage; lands as a PR from a fork)

## Tomorrow's sequence

1. **Two confirmations from the dev:** (a) which wallet holds `did:cid:…lgfe4sa` (flaxscrip) — the `sovereign` agent must run against THAT wallet, on the Signet device, never the Warden box; (b) is flaxlap Warden's `config.sovereignDid` (`HEARTHOLD_SOVEREIGN_DID`) set to flaxscrip's DID (the governor pin).
2. **PATH B CHOSEN (2026-07-14): direct signing from flaxscrip's wallet.** Cryptographically identical to the DIDComm ceremony — `signRuleset()` IS `keymaster.addProof(ruleset)`; `verifyRulesetChain` checks signer-vs-pin, not transport. Sequence:
   a. Strip `_comment` → `workshop-ruleset-v1.clean.json` (sign only the seven canonical fields — chain content-ids depend on the bytes).
   b. 🗝️ From flaxscrip's wallet: `use-id` flaxscrip → `sign-file` the clean JSON → `workshop-ruleset-v1.signed.json`.
   c. `verify-file` — proof valid AND `proof.verificationMethod` starts with `did:cid:…lgfe4sa` (the governor pin, checked by hand).
   d. `create-asset-json --alias hearthold-mage-workshop-ruleset` → **workshopRulesetDid**. Hyperswarm deliberately: acceptance artifacts are public by intent ("promoted deliberately").
   *Follow-on, not blocker:* dev item — generalize `ruleset-sign-request` beyond the KB actor ("warden sign-ruleset <file>"); needed before the workshop's first Ruleset supersession, when remote approval at the purple card is the right form.
3. ~~Sign at the Signet~~ — superseded by Path B above for the genesis document.
4. Fill `acceptance.json` (DID + date) → recompute config sha (must still be `16a3f899…`) → 🗝️ `addProof` over acceptance.json from flaxscrip's wallet → `create-asset-json` (alias `seat-acceptance`) → asset DID.
5. Dual-pin: send PrivacyMage the signed acceptance file for his CID pin.
6. Branch + commit working tree → PR to `mitchuski/hearthold_mage`. PR body: asset DID, both hashes, baseline 2049, and the two findings (console.test.mjs gitignored fixture; conformChecks boolean-vs-array doc example). His merge = seat flips *invited → seated*, T4 complete.

Runbook: `~/hearthold/docs/seat-acceptance-ceremony.md` · Analysis: `~/hearthold/docs/harness-seat-analysis.md`

## Post-ceremony thread (queued)

**Lexon experiment** — express the freshly-signed genesis Ruleset as Lexon entries against the `lexon_pvm` spec-checker (SG conventions); an afternoon's work that decides whether Rulesets/consent-text get a verified controlled-English projection. Design note: `~/hearthold/docs/lexon-ruleset-projection.md`.
