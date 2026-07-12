# hearthold_mage — an open harness seat

A scaffolded [dual-agent harness](https://github.com/mitchuski/agentprivacy-harness)
instance for **hearthold**, held open by invitation.

```
(⚔️⊥⿻⊥🧙)😊 = neg ⊕ bnot → succ
```

## The seat is empty on purpose

The conformance gate **refuses this instance today** — `harness.config.mjs`
still wears its TODOs and `frontier.json` has no baseline. That refusal *is*
the slot, mechanically held open: nothing here can run, grade, or claim until
someone accepts the invitation and fills it. A harness that grades nothing
would still say `VALIDATED`; the gate exists so this one cannot. This is trust
**T4** made structural — *an invitation establishes the acceptance relationship
before any specific proposal.*

Read **[`SLOT.md`](./SLOT.md)** — it carries the invitation in full.

## The upstream is already built

The stack itself is real and shipped: **[github.com/Flaxscrip/hearthold](https://github.com/Flaxscrip/hearthold)**
(v0.11.0 — the Warden, Recall's on-device RAG, the Knowledge Portal, the
factor-2 step-up ladder). This seat is **not** to build hearthold — it is to
build a **held-apart verification or optimization harness *on* the shipped
hearthold**.

## The direction — a runtime for content-addressed identity

What the **House of Archon** is growing toward is a dual-agent (sword ⊥ mage)
runtime for **content-addressed identity**: `did:cid`, agent identity, key
custody under delegation. That is the harness's own **holon layer** turned on
identity — *a `did:cid` CID is a κ-address*: an identity document addressed by
the sha256 of its own canonical bytes is a holon, resolving it is re-derivation,
a delegation is a relational edge (a reference proposes, a signature mints).

Candidate Gaps (offered, not decided — the acceptor chooses):

- **`did:cid` resolution integrity** — you cannot claim an identity whose CID
  you did not produce.
- **Sword ⊥ Mage identity separation** — `I(id_S ; id_M | FP) = 0`: neither
  agent's identity forgeable from the other's.
- **Key custody under delegation** — a step-up carries authority without
  carrying the key.

## Accepting

Fill the five answers of the harness's `ADOPTION.md` (Part II) into
`harness.config.mjs` — what gets better, by what number, what gate must fully
pass, what constraint no score overrides, what passes by construction — and,
before all of them, **define the Gap**. Then `node ../dual-agent-harness/engine/conform.mjs .`
must pass, and the seat is filled.

The seating is **proposed** at vertex **V60** (burning Protection · Delegation ·
Memory · Connection — a `did:cid` resolves outward), re-derivable from whatever
objective is actually accepted. Accepting, declining, or counter-offering is a
conversation between First Persons; nothing here sends, publishes, or commits on
anyone's behalf (T6).

---

Apache-2.0 · origin: 0xagentprivacy · the Privacy-is-Value model (PVM V6) ·
skeleton: [agentprivacy-harness](https://github.com/mitchuski/agentprivacy-harness)
