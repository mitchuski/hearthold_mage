// harness.config.mjs — FILLED for the hearthold seat (disclosure-debt objective).
// Prepared by GenitriX for flaxscrip's review, 2026-07-12.
//
//   REVIEW ME, then copy to:  ~/hearthold_mage/harness.config.mjs
//   Then:  cd ~/hearthold_mage && node ../dual-agent-harness/engine/conform.mjs .
//
// Every TODO from the scaffold is filled; everything else is preserved verbatim
// (door literal, schemas, keystone writes, stop rules — constitution, not ours to edit).
// The two scripts referenced below are dev-session deliverables (ceremony step 1.5):
//   scripts/measure-disclosure.mjs   — prints the baseline/candidate bundle byte count
//   scripts/check-requirement.mjs    — checks one census requirement as a relying party would

export default {
  name: "hearthold",

  objective: {
    metric:
      'disclosure-debt: byte count of the canonical-JSON (recursive sorted keys, no ' +
      'whitespace) ATTESTATION disclosure bundle that satisfies the frozen requirement ' +
      'census (census/requirements.json) against the seeded reference vault; lower is better. ' +
      'Counting rule two strangers reproduce: node scripts/measure-disclosure.mjs <bundle>',
    gate:
      '8 held-out requirement-ids drawn from census/requirements.json by the Gap; each is ' +
      'checked against the candidate bundle exactly as a relying party would check it ' +
      '(offline signature verification, window coverage, revocation checkable, issuer passes ' +
      'the trust registry, nothing disclosed outside scope). 8/8 or the round is zero (T5).',
    hardConstraint:
      'the candidate bundle is produced through decideRelease() and the workshop actor\'s ' +
      'live Ruleset chain — a bundle assembled around the Warden is not a result at any ' +
      'size (GR-3); and verification succeeds offline against issuer DIDs.',
    canary:
      'the FULL-mode disclosure of the same evidence: maximal, satisfies every census ' +
      'requirement by construction. If the canary ever fails the gate, the gate is broken, ' +
      'not the candidate.',
  },

  door: 'first-person', // T6 — leave exactly as is; conform.mjs checks the literal

  heldApartRule:
    'You are BLIND to verification witnesses (T2/GR-4). Witnesses are derived ' +
    'by hashing your proposal artifact after you finish; you never see, choose, ' +
    'or influence them. Do not suggest test inputs, seeds, points, or questions. ' +
    'Witnesses here are requirement-ids drawn from the frozen census ' +
    '(census/requirements.json); the draw derives from sha256 of proposal_canon.json — ' +
    'which requirements will be probed is unknowable while you write.',

  keystoneOnlyWrites: ['frontier.json', 'claims_register.md', 'manifest.yaml'],

  finders: [
    {
      lens: 'field-pruner',
      hint: 'remove bundle fields and revealed leaves that no census requirement reads — pure omission, never alteration',
    },
    {
      lens: 'predicate-coarsener',
      hint: 'replace exact values with the weakest form the census still accepts — counts become thresholds (>=90), timestamps become windows, enumerations become cardinalities; abstraction, never omission',
    },
  ],

  prompts: {
    measure: (ctx) =>
      `Seat MEASURE. Re-derive the current metric at ${ctx.repo}: run \`node scripts/measure-disclosure.mjs\` — it prints the canonical-JSON byte count of the current ATTESTATION disclosure bundle for the census suite against the seeded reference vault; compare to frontier.json, flag stale; price each lever family (field omissions cheap, predicate coarsening medium, granularity changes dear). Numbers only, no advocacy.`,
    propose: (finder, measure, ctx) =>
      `Seat PROPOSE — soulbae 🧙 (bnot), lens = ${finder.lens}: ${finder.hint}
Frontier context: ${JSON.stringify(measure)}.
Read ${ctx.repo}/notes/KILLED_LEVERS.md first; never re-propose a K-id without new cited evidence.
The target artifact is the ATTESTATION disclosure-bundle format for the census suite (the shape assembled by hearthold's evidence pipeline, exercised against the seeded reference vault). A diffPlan must reference the exact bundle field, revealed leaf, or granularity it changes AND the census requirement-ids it believes still pass. Propose exactly 1 lever through YOUR lens. Plan only — never implement.`,
    holdApart: (proposal, i, ctx) =>
      `Seat HOLD-APART — the Gap ⿻ (xor). Proposal artifact (verbatim):
${JSON.stringify(proposal)}
Canonically serialize it (recursive sorted keys, no whitespace) and SAVE those exact bytes to ${ctx.runDir}/p${i + 1}-${proposal.leverId}/proposal_canon.json — it must persist, it is the auditor's only route to your seed. SHA-256 that file (show the exact command; sha256sum of the saved file must equal seedHex), then draw the witnesses deterministically: read census/requirements.json, let N be its length; interpret successive 4-byte words of seedHex as big-endian integers mod N, skipping duplicates, until 8 distinct requirement-ids are drawn; record the ids (and N) in gap.json.draw. Write gap.json alongside it. Never accept proposer-suggested witnesses.`,
    assay: (proposal, gap, i, ctx) =>
      `Seat ASSAY — soulbis ⚔️ (neg), the prover.
Proposal: ${JSON.stringify(proposal)}
Gap: seed=${gap.seedHex}. Re-derive it the auditor's way first: sha256sum ${ctx.runDir}/p${i + 1}-${proposal.leverId}/proposal_canon.json must equal seedHex. BLOCKED if the file is missing or the digest does not reproduce. Transcript: ${gap.transcript}
Scratch procedure (GR-10): copy the seeded reference vault and build the candidate bundle per the diffPlan in a scratch dir under ${ctx.runDir} — never touch the originals. Confirm the hard constraint first: the bundle was produced through decideRelease() with the workshop Ruleset transcript present, and it verifies offline against issuer DIDs — if not, BLOCKED at any byte count. Then run the full held-out gate: for each of the 8 drawn requirement-ids, \`node scripts/check-requirement.mjs <id> <bundle>\` exactly as a relying party would. Measure with \`node scripts/measure-disclosure.mjs <bundle>\`. VALIDATED only if 8/8 pass AND the hard constraint holds AND the byte count beats frontier. Otherwise MIRAGE (name the failing check) or BLOCKED. Write verdict.json to ${ctx.runDir}/p${i + 1}-${proposal.leverId}/ with EXACTLY the schema's shape — flat fields, metric a bare number, no extra nesting. The file an auditor reads must match the data the orchestrator receives.`,
    critic: (proposals, verdicts, ctx) =>
      `Seat CRITIC. Proposals: ${JSON.stringify(proposals)}
Verdicts: ${JSON.stringify(verdicts)}
Classify each closed lever structural/probe-limited/noise (red-team the proposer's rationale, never the prover's verdict); draft KILLED_LEVERS entries for structural kills; name exactly ONE next lead.`,
    chronicle: (round, ctx) =>
      `Seat CHRONICLE. Draft ${ctx.runDir}/CHRONICLE_DRAFT.md following ${ctx.root}/templates/chronicle.md: verdict-first, reversals at win-prominence, handoff block ending in the critic's nextLead. Round data: ${JSON.stringify(round)}. Return the path plus a 5-line verdict summary.`,
  },

  schemas: {
    measure: {
      type: 'object', required: ['metric', 'stale', 'leverCosts'],
      properties: {
        metric: { type: 'number' },
        stale: { type: 'boolean' },
        leverCosts: { type: 'array', items: { type: 'object', required: ['lever', 'cost', 'ceiling'], properties: { lever: { type: 'string' }, cost: { type: 'string' }, ceiling: { type: 'string' } } } },
        notes: { type: 'string' },
      },
    },
    proposal: {
      type: 'object', required: ['proposals'],
      properties: {
        proposals: {
          type: 'array', minItems: 1,
          items: {
            type: 'object',
            required: ['leverId', 'title', 'lens', 'rationale', 'expectedMetric', 'hardConstraintNote', 'diffPlan'],
            properties: {
              leverId: { type: 'string' }, title: { type: 'string' }, lens: { type: 'string' },
              rationale: { type: 'string' }, expectedMetric: { type: 'number' },
              hardConstraintNote: { type: 'string' }, diffPlan: { type: 'string' },
              killedLeverCitations: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    gap: {
      type: 'object', required: ['seedHex', 'draw', 'transcript'],
      properties: {
        seedHex: { type: 'string' },
        draw: { type: 'string', description: 'the witnesses drawn, as data' },
        transcript: { type: 'string', description: 'serialization + hash command + draw rule, third-party re-derivable' },
      },
    },
    verdict: {
      type: 'object', required: ['leverId', 'status', 'evidence'],
      properties: {
        leverId: { type: 'string' },
        status: { type: 'string', enum: ['VALIDATED', 'MIRAGE', 'BLOCKED'] },
        metric: { type: 'number' }, gateResult: { type: 'string' },
        failingCheck: { type: 'string' }, evidence: { type: 'string' }, scratchDir: { type: 'string' },
      },
    },
    critic: {
      type: 'object', required: ['classifications', 'nextLead'],
      properties: {
        classifications: { type: 'array', items: { type: 'object', required: ['leverId', 'class', 'why'], properties: { leverId: { type: 'string' }, class: { type: 'string', enum: ['structural', 'probe-limited', 'noise', 'mis-gated'] }, why: { type: 'string' } } } },
        nextLead: { type: 'string' },
        killedLeverDrafts: { type: 'array', items: { type: 'string' } },
      },
    },
  },

  stop: { dryRounds: 2, maxRounds: 5 },

  isValidated: (v) => v.status === 'VALIDATED',
  isStructural: (critic, leverId) =>
    (critic.classifications || []).some(c => c.leverId === leverId && c.class === 'structural'),

  // instance-specific numeric checks conform.mjs runs on frontier.json.
  // Fitted at ceremony step 1.5: the baseline is a measured, frozen number
  // (2049 bytes, produced by the hygienic local-registry path — see frontier.json
  // baseline.how and census/FROZEN.md). Pin it so a drifted or re-templated
  // frontier is refused. Reviewed + approved by flaxscrip and Fable, 2026-07-13.
  // conform.mjs does `for (const e of check(f) || [])`, so a check returns an
  // ARRAY of error strings ([] = pass), not a boolean.
  conformChecks: [
    (f) => f.baseline?.metric === 2049 ? [] : [`frontier.baseline.metric must be the frozen 2049, got ${JSON.stringify(f.baseline?.metric)}`],
  ],
}
