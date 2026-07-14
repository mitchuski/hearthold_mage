#!/usr/bin/env node
// self-test.mjs — the instance acceptance test (HARNESS-SEAT-BRIEF §D5.2–3).
//
//   node scripts/self-test.mjs
//
// Two properties a working gate must have, proven together:
//   CANARY  — the FULL-mode bundle satisfies EVERY census requirement. A failure
//             here means a census entry the canary cannot meet (§0): the feasible
//             set is empty and every verdict grades the config, not the candidate.
//   NEGATIVE — the gate can actually FAIL. Each fixture mutates the FULL bundle to
//             break exactly one requirement and asserts that requirement's check
//             refuses it, by name. A gate nothing fails is worth less than none.
//
// check-requirement.mjs is invoked as a SUBPROCESS (never imported), so its
// zero-dependency verifier boundary is exercised exactly as a relying party would.
// Assembling the bundle uses the hearthold seam and needs the live node.

import { spawnSync } from 'node:child_process'
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import https from 'node:https'
import { assembleBaselineBundle } from './assemble-baseline.mjs'
import { measure } from './measure-disclosure.mjs'
import { REFERENCE_REGISTRY } from './seed-reference-vault.mjs'

const NODE_URL = process.env.HEARTHOLD_NODE_URL || 'http://flaxlap.local:4222'

/** Resolve a DID via the local Gatekeeper and return its registration.registry. */
function registryOf(did) {
  const url = `${NODE_URL}/api/v1/did/${encodeURIComponent(did)}`
  const lib = url.startsWith('https:') ? https : http
  return new Promise((res, rej) => {
    lib.get(url, { timeout: 10000 }, (r) => {
      let b = ''
      r.on('data', (d) => (b += d))
      r.on('end', () => { try { res(JSON.parse(b)?.didDocumentRegistration?.registry) } catch (e) { rej(e) } })
    }).on('error', rej)
  })
}

const HERE = dirname(fileURLToPath(import.meta.url))
const CENSUS = JSON.parse(readFileSync(join(HERE, '..', 'census', 'requirements.json'), 'utf8'))
const CHECK = join(HERE, 'check-requirement.mjs')
const scratch = mkdtempSync(join(tmpdir(), 'mage-selftest-'))

/** Run the gate CLI for one id against a bundle file → { code, err }. */
function check(id, path) {
  const r = spawnSync(process.execPath, [CHECK, id, path], { encoding: 'utf8' })
  return { code: r.status, err: (r.stderr || '').trim() }
}

// Each negative: a deep-cloned mutation that must make `id` fail.
const NEGATIVES = [
  { id: 'R01', label: 'proof stripped', mutate: (b) => { delete b.proof } },
  { id: 'R01', label: 'signature tampered', mutate: (b) => { b.proof.proofValue = 'AAAA' + b.proof.proofValue.slice(4) } },
  { id: 'R02', label: 'merkleRoot/artefactIds inconsistent', mutate: (b) => { b.credentialSubject.evidence[0].commitment.artefactIds = 'merkle:sha256:deadbeef' } },
  { id: 'R04', label: 'window not covered', mutate: (b) => { b.credentialSubject.evidence[0].observedTo = '2026-02-01T00:00:00Z' } },
  { id: 'R05', label: 'count below threshold', mutate: (b) => { b.credentialSubject.evidence[0].count = 10 } },
  { id: 'R08', label: 'out-of-window revealed leaf', mutate: (b) => { b.credentialSubject.evidence[0].revealed = [{ index: 0, kind: 'location', observedAt: '2025-01-01T00:00:00Z', salt: 'x', path: [] }] } },
  { id: 'R09', label: 'third-party DID injected', mutate: (b) => { b.credentialSubject.claim += ' did:cid:bagaaieraffffffffffffffffffffffffffffffffffffffffffffffffffz' } },
  { id: 'R10', label: 'raw payload leaked', mutate: (b) => { b.credentialSubject.ciphertext = 'oops' } },
  { id: 'R12', label: 'type truncated', mutate: (b) => { b.type = ['VerifiableCredential'] } },
  { id: 'R16', label: 'requester-authored description', mutate: (b) => { b.credentialSubject.descriptionSource = 'requester-asserted' } },
  { id: 'R18', label: 'evidence mirror diverged', mutate: (b) => { b.evidence[0].count = 999 } },
  { id: 'R19', label: 'txn inconsistent', mutate: (b) => { b.termsOfUse[0].txn = 'different' } },
  { id: 'R21', label: 'expired', mutate: (b) => { b.validUntil = '2000-01-01T00:00:00Z' } },
  { id: 'R22', label: 'single-use not declared', mutate: (b) => { b.termsOfUse = [] } },
]

async function main() {
  process.stderr.write(`assembling FULL reference bundle…\n`)
  const bundle = await assembleBaselineBundle()
  const bundlePath = join(scratch, 'full.json')
  writeFileSync(bundlePath, JSON.stringify(bundle))
  process.stderr.write(`FULL bundle: ${measure(bundle)} canonical bytes, ${CENSUS.length} census entries\n\n`)

  let ok = true

  // ---- REGISTRY HYGIENE ---------------------------------------------------
  // Every DID the seed minted must be on the local registry — never gossiped to
  // mainnet (REGISTRY-HYGIENE-BRIEF §3). This is the check that would have caught
  // the ~800-DID incident on day one.
  process.stderr.write('REGISTRY — every seed DID resolves as local:\n')
  const dids = {
    issuer: bundle.issuer,
    subject: bundle.credentialSubject?.id,
    schema: bundle.credentialSchema?.id,
  }
  for (const [label, did] of Object.entries(dids)) {
    let reg
    try { reg = await registryOf(did) } catch (e) { reg = `<unresolvable: ${e.message}>` }
    if (reg === REFERENCE_REGISTRY) process.stderr.write(`  ok    ${label} on '${reg}' — ${did}\n`)
    else { ok = false; process.stderr.write(`  LEAK  ${label} on '${reg}' (must be '${REFERENCE_REGISTRY}') — ${did}\n`) }
  }
  process.stderr.write('\n')

  // ---- CANARY -------------------------------------------------------------
  process.stderr.write('CANARY — every census id vs the FULL bundle:\n')
  for (const req of CENSUS) {
    const { code, err } = check(req.id, bundlePath)
    if (code === 0) process.stderr.write(`  pass  ${req.id}  ${req.title}\n`)
    else { ok = false; process.stderr.write(`  FAIL  ${req.id}  ${req.title} — ${err}\n`) }
  }

  // ---- NEGATIVE -----------------------------------------------------------
  process.stderr.write('\nNEGATIVE — each mutation must be refused by its target check:\n')
  for (const neg of NEGATIVES) {
    const b = structuredClone(bundle)
    neg.mutate(b)
    const p = join(scratch, `neg-${neg.id}-${neg.label.replace(/\W+/g, '_')}.json`)
    writeFileSync(p, JSON.stringify(b))
    const { code, err } = check(neg.id, p)
    if (code === 1) process.stderr.write(`  ok    ${neg.id} refuses "${neg.label}" — ${err}\n`)
    else { ok = false; process.stderr.write(`  LEAK  ${neg.id} did NOT refuse "${neg.label}" (exit ${code})\n`) }
  }

  process.stderr.write(`\n${ok ? '✓ SELF-TEST PASS — canary satisfied, gate refuses every negative' : '✗ SELF-TEST FAIL'}\n`)
  process.exit(ok ? 0 : 1)
}

main().catch((e) => { process.stderr.write(`self-test error: ${e.message}\n`); process.exit(1) })
