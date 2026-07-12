# SLOT — an open seat, held for the House of Archon

This instance is deliberately unfinished. That is not neglect; it is an
**invitation** (trust T4): *an invitation establishes the acceptance
relationship before any specific proposal.* The proposal is yours to make.

```
(⚔️⊥⿻⊥🧙)😊 = neg ⊕ bnot → succ
```

## What this is

A scaffolded dual-agent harness instance for **hearthold** — the household
sovereignty stack (the Warden who guards, Recall who remembers, the Knowledge
Portal that faces outward, the factor-2 step-up ladder). The skeleton it hangs
on lives at `../dual-agent-harness`; read its `README.md` pathway and
`ADOPTION.md` before anything here.

## The upstream — hearthold is already built

The stack itself is real and shipped: **github.com/Flaxscrip/hearthold**
(v0.11.0 — the Warden, Recall's on-device RAG, the Knowledge Portal, the
factor-2 step-up ladder; IMPLEMENTED upstream). So this slot is **not** to
build hearthold — it is to build a **held-apart verification or optimization
harness *on* the shipped hearthold**: a loop whose proposer improves some
measurable property of the stack and whose prover checks it against witnesses
the proposer could not have tuned to. The direction points there; the door
stays open (T4 — the invitation precedes the proposal, and the proposal is the
House of Archon's to make).

The conformance gate **refuses this instance today** — `harness.config.mjs`
still wears its TODOs, `frontier.json` has no measured baseline. That refusal
is the slot, mechanically held open: nothing here can run, grade, or claim
until someone accepts the invitation and fills it. A harness that grades
nothing will still say VALIDATED; the gate exists so this one cannot.

## The invitation

**To the House of Archon:** this seat is held for you. Accepting it means
answering the five questions of `ADOPTION.md` Part II step 1, in writing, in
`harness.config.mjs`:

1. **What artifact gets better?** (one file/system, scratch-copyable)
2. **By what single number?** (a counting rule two strangers reproduce)
3. **What must FULLY pass?** (the gate — a partial pass is worth zero, T5)
4. **What may no score override?** (the hard constraint, GR-3)
5. **What passes by construction?** (the canary — or you cannot tell a bad
   candidate from an impossible gate)

And before all of them, step 2: **define the Gap** — how held-out witnesses
derive from a proposal by hashing. If the claim space turns out enumerable,
build an auditor instead and say so; that is a valid acceptance too
(`HARNESS_PATHS.md`, the negative result).

## What the House of Archon is growing toward

Not merely a compressor for hearthold's features — a **dual-agent runtime for
content-addressed identity**: `did:cid`, agent identity, the sword ⊥ mage held
apart at the identity layer. And that is not a new idea to bolt on — it is the
harness's own **holon layer** (`HOLONS.md`) turned on identity: **a `did:cid`
CID *is* a κ-address.** An identity document addressed by the sha256 of its own
canonical bytes is a holon; resolving it is re-derivation (Law L5, never
trusted only re-derived); a delegation between agents is a relational edge (a
reference proposes, a signature mints — the VRC). The κ law (`tools/kappa.mjs`)
and the mesh auditor (`tools/holon_audit.mjs`) already in the core are the
substrate; this slot is where they become an **identity runtime** on the shipped
hearthold.

That is why the seating burns **Connection** (V60): a content-addressed identity
*resolves outward* — a DID is a public handle to a private root. It is not a
vault (which burns Value and holds); it is a door with a name that anyone can
re-derive and no one can forge.

## Candidate directions — offered, not decided

Identity-shaped objectives, each of which would earn a Gap:

- **`did:cid` resolution integrity** — a DID resolves to exactly the
  content-addressed identity document it names; the Gap draws witnesses by
  hashing a proposed identity update, and the resolved CID must match the
  claimed one. You cannot claim an identity whose CID you did not produce — the
  holon layer, made an identity gate.
- **Sword ⊥ Mage identity separation** — the boundary agent's identity and the
  delegation agent's identity are held apart: `I(id_S ; id_M | FP) = 0`, so
  neither agent's identity can be forged or inferred from the other's. The Gap
  is the non-collusion of *who they are*, not only of what they produce.
- **Key custody under delegation** — a step-up delegation carries *authority*
  without carrying the *key*: the Warden's root never leaves its bound context
  across a factor-2 rung; witnesses drawn from the delegation transcript prove
  the key did not travel.

Adjacent (hearthold's own surface, if identity is not the first cut): Recall
fidelity (RAG answers from its own contents alone), Portal
disclosure-minimization (the public face discloses no more than authorized).

Pick one, none, or a better one. The directions are scaffolding; the decision
is the acceptor's.

## The seating, proposed

The universe layer records this slot as a **determined vacancy**: workshop
hearthold at **V60** — burning Protection 🛡️ (the Warden, the private root),
Delegation 🤝 (the step-up ladder, agents acting on authority), Memory 📜
(Recall), Connection 🔗 (the `did:cid` resolving outward — a public handle to a
private root) — forcing the anchor **V3 = Computation + Value**, exactly: *the
hearth burns care, not compute; what it refuses to become is a raw ledger.*
V60 ⊕ V3 = 63, checked by `universe/audit.mjs`. **Connection, not Value, is the
fourth bit** — that is precisely what separates this identity seat (V60) from
the Curatrix Vault (V57, which burns Value because a vault *holds*). This
seating is **proposed at invitation**, not sealed — re-derive it from your
accepted objective's actual burns; the anchor follows the seating and is never
chosen (the anchor law).

**Not to be confused** with two neighbours the corpus already seats:

- the **Curatrix Vault** at `/vault` **V57** (Aria Silverhue 🪞, the Reliquary
  in the City) — a provenance-curation shop, a different vertex and a different
  keeper. The hearthold *harness* is V60, not V57.
- the FLEET arc's **"Hold" phase** (`FLEET.md`), which maps the *upstream
  hearthold project* to the sealing step of Reclaim → Hold → Prove → Spend →
  Observe. That phase describes what the shipped stack already does; **this
  seat is the open harness *on* it**, and it is the only hearthold address the
  House of Archon is invited to fill.

## The door

Accepting, declining, or counter-offering this invitation is a conversation
between First Persons. Nothing in this directory sends, publishes, or commits
anything (T6/GR-8). When the slot is filled and the first frontier moves, the
instance registers its true weight in `HARNESS_PATHS.md` — until then its
honest label is **OPEN**.

*The gate refusing to pass is the seat being kept warm.*
