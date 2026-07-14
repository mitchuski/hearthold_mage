#!/usr/bin/env node
// seed-reference-vault.mjs — the reference vault (D4, ceremony step 1.4).
//
// Provisions a Warden + a subject identity and seeds a DETERMINISTIC vault:
// 142 location observations across the census window plus a few documents, with
// fixed ids/timestamps/payloads (from reference-data.mjs). Because the content
// is fixed and the merkle salts are seeded (assembleEvidence saltSeed), the
// disclosure-debt baseline is a number two strangers reproduce.
//
//   node scripts/seed-reference-vault.mjs
//
// Isolation & determinism: an ISOLATED, PERSISTENT data root (default
//   $TMPDIR/hearthold-mage-refvault, override with HEARTHOLD_DATA_ROOT) — never
// a real wallet (~/.hearthold). Idempotent: re-running reuses the wallet.json
// (so the issuer/subject DIDs stay stable across re-seeds) and only puts
// artefacts that are missing. We do NOT call newWallet() — ensureIdentity's
// contract is that listIds() auto-creates the wallet; a second newWallet()
// poisons the HD cache. Stability across re-seeds therefore comes from
// persisting the data root, not from a fixed mnemonic.

import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdirSync } from 'node:fs'
import { core, VaultStore } from './hearthold.mjs'
import { referenceArtefacts } from './reference-data.mjs'

const { loadConfig, openKeymaster, ensureIdentity, Sensitivity } = core

export const DATA_ROOT =
  process.env.HEARTHOLD_DATA_ROOT || join(tmpdir(), 'hearthold-mage-refvault')
const PASSPHRASE = process.env.HEARTHOLD_PASSPHRASE || 'hearthold-mage-reference'

export const REFERENCE_REGISTRY = 'local'

/**
 * Config pinned to the isolated reference root on the LOCAL registry.
 *
 * Registry hygiene (REGISTRY-HYGIENE-BRIEF.md): an isolated data root is NOT an
 * isolated registry — a `createId`/`createAsset` on the node's default
 * ('hyperswarm') gossips to mainnet forever. The reference vault is a test
 * fixture, so it is local-only: local DIDs resolve on this node and die with its
 * DB, never distributed. Because openKeymaster sets the Keymaster instance's
 * defaultRegistry from config.registry, forcing it here also makes the schema and
 * the attestation credential (which ride createAsset) local — closing the
 * asset-path gap (brief §2), not just identities.
 *
 * Fail LOUD, not open: default to local when unset, and refuse an explicit
 * non-local registry rather than silently polluting mainnet. "Born local,
 * promoted deliberately."
 */
export function referenceConfig() {
  const requested = process.env.HEARTHOLD_REGISTRY ?? REFERENCE_REGISTRY
  if (requested !== REFERENCE_REGISTRY) {
    throw new Error(
      `refusing to seed the reference vault on registry '${requested}': it is ${REFERENCE_REGISTRY}-only ` +
        `(unset HEARTHOLD_REGISTRY or set it to '${REFERENCE_REGISTRY}'). A DID registration is itself a disclosure.`,
    )
  }
  return { ...loadConfig(), dataRoot: DATA_ROOT, registry: REFERENCE_REGISTRY }
}

/**
 * Seed (idempotently) and return the provisioned handles + identities, so the
 * assembler can reuse the exact same wallets without re-opening them.
 */
export async function seedReferenceVault() {
  mkdirSync(DATA_ROOT, { recursive: true })
  const config = referenceConfig()

  const warden = await openKeymaster('warden', config, PASSPHRASE)
  const subject = await openKeymaster('sovereign', config, PASSPHRASE)
  const wardenId = await ensureIdentity(warden, config)
  const subjectId = await ensureIdentity(subject, config)

  const vault = new VaultStore(warden.dataFolder)
  const have = new Set((await vault.list()).map((a) => a.id))
  const arts = referenceArtefacts()
  let seeded = 0
  for (const a of arts) {
    if (have.has(a.id)) continue
    await vault.put({
      id: a.id,
      kind: a.kind,
      observedAt: a.observedAt,
      storedAt: a.observedAt, // fixed (not "now") — determinism; not part of the bundle
      sensitivity: Sensitivity[a.sensitivity], // 'LOW' → the enum member
      // The payload never enters the disclosure bundle (a merkle leaf commits to
      // salt|kind|observedAt, not content), so a fixed synthetic placeholder is
      // sufficient for a reference vault — no live sealing, no non-determinism.
      ciphertext: `ref:${a.payload}`,
      metadata: { witness: a.witness },
    })
    seeded++
  }

  return { config, warden, subject, wardenId, subjectId, vault, seeded, total: arts.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await seedReferenceVault()
  process.stdout.write(
    `reference vault seeded\n` +
      `  data root:  ${DATA_ROOT}\n` +
      `  Warden DID:  ${r.wardenId.did}\n` +
      `  subject DID: ${r.subjectId.did}\n` +
      `  artefacts:   ${r.total} total (${r.seeded} newly written, ${r.total - r.seeded} already present)\n`,
  )
  process.exit(0)
}
