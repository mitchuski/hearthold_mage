# Census — design & audit trail

What each requirement is, where it came from, and why it is checkable from the
bundle + the public node alone (never the vault). This is the audit trail for the
**gate itself** — the census is the enumerable list of things a relying party may
legitimately demand of a disclosure bundle, and nothing here demands more than the
FULL-mode canary carries (proven by `scripts/self-test.mjs`).

## How the census was built (the §0 design law)

Bundle-first, not census-first. The reference vault was seeded and the real
FULL-mode `HearthholdAttestation` bundle was assembled through hearthold's own
evidence pipeline **before** a single requirement was written; every entry was then
mined from what that bundle actually carries. This is deliberate: the retired
universe-builder instance wrote a census as an aspiration, its canary scored 0/8
against a gate no candidate could pass, and every verdict measured the config
instead of the candidate. Three catches during mining prove the discipline earned
its keep:

- The window selection is exclusive at the `to` boundary, so a bare `2026-06-30`
  dropped the last day's observation (count 141, `observedTo` 06-28). Fixed by
  selecting with an end-of-day `to`; R04 now covers a window the evidence provably
  spans.
- Archon carries **no `credentialStatus`** (revocation is enforced at resolution,
  not by an embedded status object) and the disclosed VC carries no self-DID, so
  per-credential revocation is **not** checkable from the bundle alone. The
  template's "revocation checkable" entry was therefore **dropped**, not forced —
  including it would empty the feasible set.
- The `credentialSchema.id` is a **third** DID beyond issuer and subject, so the
  "no third-party identifier" absence claim (R09) had to explicitly permit it (it
  is the credential's own schema, public infrastructure, not a counterparty).

## The three mined sources

- **A — verifier assertions** in `e2e-prove` / `e2e-prove-didcomm` /
  `e2e-scroll-burn` / `e2e-evidence*` (what a relying party actually checks today).
- **B — the minted attestation + `EvidenceGraphSummary`** fields (the shape the
  pipeline emits).
- **C — the CGPR conformance list**, `A2A-BRIEF.md §4.4` (scope, single-use burn,
  pairwise unlinkability, no pre-approval subject leakage).

## The requirements

| id | kind | source | absence? | why bundle-only (or public-only) |
|---|---|---|---|---|
| R01 | crypto | A (`e2e-prove`: "proof verifies") | | signature verified with `node:crypto` over JCS(vc−proof); issuer key resolved via local Gatekeeper `/api/v1/did` |
| R02 | crypto | B (commitment) | | bundle-only: alg/root-shape/artefactIds consistency |
| R03 | crypto | A (`e2e-evidence-selective`) | vacuous in FULL | bundle-only: re-derive each revealed leaf to the signed root |
| R04 | coverage | B (observedFrom/To) | | bundle-only: date-granularity window coverage |
| R05 | coverage | A (`e2e-evidence`: count) | | bundle-only: count ≥ 90 (threshold, exact count not required) |
| R06 | coverage | B (kind) | | bundle-only |
| R07 | coverage | B (summary.evidence) | | bundle-only: observedFrom ≤ observedTo |
| R08 | scope | C §4.4(4); A | **yes** | bundle-only: no revealed leaf outside the window |
| R09 | scope | C §4.4(1)/(7) | **yes** | bundle-only: only issuer/subject/schema DIDs appear |
| R10 | scope | B (evidence-graph design) | **yes** | bundle-only: only commitments, never artefact content |
| R11 | scope | C §4.4(1) | **yes** | bundle-only: no linkage identifier on the subject |
| R12 | shape | B (type) | | bundle-only |
| R13 | shape | B (subject.type) | | bundle-only |
| R14 | shape | B (@context) | | bundle-only |
| R15 | schema | A (schema challenge) | | public: schema DID resolves via Gatekeeper; bundle satisfies its `required` |
| R16 | shape | invariant: Warden authors consent | | bundle-only: descriptionSource = machine-derived |
| R17 | shape | A (`e2e-composite`) | | bundle-only: trustClass ∈ {witnessed, composite} |
| R18 | consistency | B (mirrored evidence) | | bundle-only: top-level evidence = subject.evidence |
| R19 | consistency | B (txn) | | bundle-only: subject.txn = termsOfUse txn |
| R20 | registry | A (`e2e-prove`: untrusted rejected) | | public: issuer resolves; proof key ∈ issuer assertionMethod |
| R21 | lifecycle | B (validUntil) | | bundle + check-time clock |
| R22 | lifecycle | A (`e2e-scroll-burn`); C §4.4(5) | | bundle-only: HearthholdSingleUse + txn |
| R23 | lifecycle | B (validFrom/validUntil) | | bundle-only: validFrom ≤ validUntil |

**Absence claims (R08–R11)** are first-class machine claims, not prose — the
lexon_pvm lesson that direction and absence must be checkable. In the FULL canary
they hold by construction (nothing revealed, only issuer/subject/schema DIDs, only
commitments, no linkage field); a shrinking candidate that violated one would be
refused by name, as `self-test.mjs` demonstrates.

## The verifier boundary

`scripts/check-requirement.mjs` imports nothing from hearthold and reads no vault or
Warden state. Its whole knowledge is the bundle plus the local Gatekeeper's public
resolution surface. The **hard constraint** (bundle produced through
`decideRelease()` / the workshop Ruleset chain) is deliberately **not** a census
entry — the assay seat checks it separately, before the gate.
