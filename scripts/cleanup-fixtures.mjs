#!/usr/bin/env node
// cleanup-fixtures.mjs — revoke the DIDs a pre-hygiene run registered on mainnet.
//
//   node scripts/cleanup-fixtures.mjs <dataRoot> [<dataRoot> ...]
//
// Registry hygiene (REGISTRY-HYGIENE-BRIEF §5): the reference-vault build ran
// before HEARTHOLD_REGISTRY=local was wired, so its agents (warden, sovereign)
// and the assets they created (the HearthholdAttestation schema + the minted
// attestation credentials) were registered on the public hyperswarm registry.
// Revocation doesn't shrink the gossip log — agents have no validUntil — but it
// marks them dead so any future GC/filter can treat them as prunable, and it
// records exactly what leaked. Idempotent; prints a revocation list for the
// hygiene brief's cleanup ledger. Requires the controlling wallet + the node.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { core } from './hearthold.mjs'

const { loadConfig, openKeymaster } = core
const PASSPHRASE = process.env.HEARTHOLD_PASSPHRASE || 'hearthold-mage-reference'
const roots = process.argv.slice(2)
if (roots.length === 0) { process.stderr.write('usage: node scripts/cleanup-fixtures.mjs <dataRoot> [...]\n'); process.exit(2) }

const ledger = []
const revoke = async (km, did, label) => {
  try {
    const before = (await km.resolveDID(did)).didDocumentRegistration?.registry
    const ok = await km.revokeDID(did)
    ledger.push({ label, did, registry: before, revoked: !!ok })
    process.stderr.write(`  ${ok ? 'revoked' : 'no-op '} ${label} [${before}] ${did}\n`)
  } catch (e) {
    ledger.push({ label, did, error: e.message })
    process.stderr.write(`  ERROR   ${label} ${did} — ${e.message}\n`)
  }
}

for (const root of roots) {
  process.stderr.write(`ROOT ${root}\n`)
  for (const role of ['warden', 'sovereign']) {
    if (!existsSync(join(root, role, 'wallet.json'))) continue
    const h = await openKeymaster(role, { ...loadConfig(), dataRoot: root }, PASSPHRASE)
    const km = h.keymaster
    for (const name of await km.listIds()) {
      await km.setCurrentId(name)
      const agentDid = (await km.resolveDID(name)).didDocument.id
      // Owned assets first (schemas, credentials), then issued creds, then the agent itself.
      const assets = await km.listAssets().catch(() => [])
      const issued = await km.listIssued().catch(() => [])
      for (const a of new Set([...(assets || []), ...(issued || [])])) await revoke(km, a, `${role}/${name} asset`)
      await revoke(km, agentDid, `${role}/${name} agent`)
    }
  }
}

process.stdout.write(JSON.stringify(ledger, null, 2) + '\n')
process.stderr.write(`\nrevocation ledger: ${ledger.filter((e) => e.revoked).length} revoked, ${ledger.filter((e) => e.error).length} errors, of ${ledger.length} entries\n`)
