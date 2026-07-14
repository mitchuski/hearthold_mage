#!/usr/bin/env node
// assemble-baseline.mjs — assemble the FULL-mode ATTESTATION disclosure bundle
// (the canary) from the reference vault, via hearthold's real evidence pipeline.
//
// "FULL mode" = EvidenceGroup.disclosure === 'summary': every observation is
// committed under the merkle root, NONE individually revealed. This is the
// maximal bundle that satisfies every census requirement by construction — the
// thing a candidate must shrink without dropping a requirement.
//
// Pipeline (direct mint path, no decideRelease gating — the assay seat checks
// the hard constraint separately): seed → read vault → assembleEvidence (with a
// fixed saltSeed for byte-reproducibility) → mintEvidenceGraph → getCredential.
// Returns the decrypted VC-with-proof exactly as a relying party receives it.

import { core } from './hearthold.mjs'
import { seedReferenceVault } from './seed-reference-vault.mjs'
import { SALT_SEED, REFERENCE_CLAIM, REFERENCE_STRUCTURED, REFERENCE_TXN, REFERENCE_VALID_UNTIL, SELECT_WINDOW } from './reference-data.mjs'

const { assembleEvidence, mintEvidenceGraph, getCredential } = core

/** Map a stored vault artefact to the ArtefactMeta shape assembleEvidence consumes. */
const toMeta = (a) => ({
  id: a.id,
  kind: a.kind,
  observedAt: a.observedAt,
  sensitivity: a.sensitivity,
  witnessedBy: a.metadata?.witness ?? 'self',
})

/**
 * Assemble the FULL-mode reference bundle and return the VC object.
 * Idempotent-ish: re-seeds (no-op if present) then mints a fresh credential.
 * The bundle is byte-stable across runs except proof.created (fixed-length),
 * because identity + content + salts are all deterministic.
 */
export async function assembleBaselineBundle() {
  const { warden, subjectId, vault } = await seedReferenceVault()

  const metas = (await vault.list()).map(toMeta)
  const spec = { kind: 'location', from: SELECT_WINDOW.from, to: SELECT_WINDOW.to }
  const assembled = assembleEvidence(metas, spec, { saltSeed: SALT_SEED })
  if (!assembled) throw new Error('assembleEvidence returned null (no location artefacts selected)')
  // FULL mode: leave disclosure = 'summary' (do NOT set reveal/revealed).

  const { credentialDid } = await mintEvidenceGraph(warden, {
    subjectDid: subjectId.did,
    claim: REFERENCE_CLAIM,
    structured: REFERENCE_STRUCTURED,
    evidence: [assembled.group],
    txn: REFERENCE_TXN,
    validUntil: REFERENCE_VALID_UNTIL,
  })

  const bundle = await getCredential(warden, credentialDid)
  if (!bundle || !bundle.proof) throw new Error('minted credential has no proof')
  return bundle
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bundle = await assembleBaselineBundle()
  const group = bundle.credentialSubject?.evidence?.[0]
  process.stderr.write(
    `assembled FULL reference bundle\n` +
      `  issuer:      ${bundle.issuer}\n` +
      `  subject:     ${bundle.credentialSubject?.id}\n` +
      `  type:        ${JSON.stringify(bundle.type)}\n` +
      `  disclosure:  ${group?.disclosure} (count=${group?.count}, ${group?.observedFrom} … ${group?.observedTo})\n` +
      `  merkleRoot:  ${group?.commitment?.merkleRoot}\n` +
      `  proof.type:  ${bundle.proof?.type}\n`,
  )
  process.stdout.write(JSON.stringify(bundle, null, 2) + '\n')
  process.exit(0)
}
