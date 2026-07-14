#!/usr/bin/env node
// check-requirement.mjs — the relying-party gate runner (D3).
//
//   node scripts/check-requirement.mjs <id> <bundle.json>
//     exit 0  → the bundle satisfies census requirement <id>
//     exit 1  → it does not; the failing check is named on stderr
//
// THE VERIFIER BOUNDARY IS THE WHOLE POINT (HARNESS-SEAT-BRIEF §D3). This script
// may read the bundle, resolve DIDs via the local Gatekeeper, and validate the
// schema the credential names. It may NEVER read the reference vault, the
// Warden's stores, or any hearthold internal state — and it imports NOTHING from
// hearthold. Everything it knows, a stranger holding only the bundle and the
// public node could know too. If a requirement cannot be checked from here, the
// requirement is wrong (fix the census), not this script.
//
// Zero npm dependencies: node: stdlib only.

import { readFileSync } from 'node:fs'
import { createHash, createPublicKey, verify as cryptoVerify } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import http from 'node:http'
import https from 'node:https'

const HERE = dirname(fileURLToPath(import.meta.url))
const CENSUS = join(HERE, '..', 'census', 'requirements.json')
const NODE_URL = process.env.HEARTHOLD_NODE_URL || 'http://flaxlap.local:4222'

// ---------------------------------------------------------------------------
// primitives
// ---------------------------------------------------------------------------
const sha256hex = (s) => createHash('sha256').update(s).digest('hex')

// RFC 8785 JCS — the canonicalization keymaster signs over (NOT the κ metric).
// Used only by R01 to reconstruct the signed preimage.
function jcs(object) {
  if (object === null || typeof object !== 'object') return JSON.stringify(object)
  if (typeof object.toJSON === 'function') return jcs(object.toJSON())
  if (Array.isArray(object)) return '[' + object.map((v) => jcs(v === undefined ? null : v)).join(',') + ']'
  return '{' + Object.keys(object).sort()
    .filter((k) => object[k] !== undefined && typeof object[k] !== 'symbol')
    .map((k) => JSON.stringify(k) + ':' + jcs(object[k])).join(',') + '}'
}

// hearthold's leaf digest + merkle path check, re-implemented byte-exact so a
// revealed leaf can be verified without importing @hearthold/core.
const leafDigest = (salt, kind, observedAt) => sha256hex(`${salt}|${JSON.stringify({ kind, observedAt })}`)
function verifyMerklePath(leaf, path, root) {
  if (!root || root.length === 0) return false
  let h = leaf
  for (const s of path || []) h = s.position === 'left' ? sha256hex(s.hash + h) : sha256hex(h + s.hash)
  return h === root
}

/** GET {node}/api/v1/did/{did}[?versionTime=...] → parsed resolution. Local node only. */
function resolveDID(did, versionTime) {
  const q = versionTime ? `?versionTime=${encodeURIComponent(versionTime)}` : ''
  const url = `${NODE_URL}/api/v1/did/${encodeURIComponent(did)}${q}`
  const lib = url.startsWith('https:') ? https : http
  return new Promise((res, rej) => {
    const req = lib.get(url, { timeout: 10000 }, (r) => {
      let body = ''
      r.on('data', (d) => (body += d))
      r.on('end', () => {
        if (r.statusCode !== 200) return rej(new Error(`Gatekeeper ${r.statusCode} resolving ${did}`))
        try { res(JSON.parse(body)) } catch (e) { rej(new Error(`bad resolution JSON for ${did}: ${e.message}`)) }
      })
    })
    req.on('timeout', () => { req.destroy(new Error(`Gatekeeper timeout resolving ${did}`)) })
    req.on('error', rej)
  })
}

const groupsOf = (b) => (Array.isArray(b?.credentialSubject?.evidence) ? b.credentialSubject.evidence : [])
const dateOf = (iso) => String(iso).slice(0, 10)
const allDids = (b) => [...new Set([...JSON.stringify(b).matchAll(/did:cid:[a-z0-9]+/g)].map((m) => m[0]))]
const parseWindow = (p) => { const [from, to] = String(p.window || '').split('/'); return { from, to } }
const pass = { ok: true }
const fail = (reason) => ({ ok: false, reason })

// ---------------------------------------------------------------------------
// the checks — one per census id. Each returns {ok} or {ok:false, reason}.
// ---------------------------------------------------------------------------
const CHECKS = {
  async R01(b) {
    const p = b.proof
    if (!p || p.type !== 'EcdsaSecp256k1Signature2019') return fail('proof missing or not EcdsaSecp256k1Signature2019')
    if (!p.verificationMethod || !p.proofValue) return fail('proof lacks verificationMethod/proofValue')
    const signer = p.verificationMethod.split('#')[0]
    const frag = p.verificationMethod.split('#')[1]
    let doc
    try { doc = await resolveDID(signer, p.created) } catch (e) { return fail(`issuer DID unresolvable: ${e.message}`) }
    const vms = doc?.didDocument?.verificationMethod || []
    const vm = vms.find((m) => (m.id || '').replace(/^#/, '') === frag) || vms[0]
    if (!vm?.publicKeyJwk) return fail('issuer DID document has no publicKeyJwk')
    let key
    try { key = createPublicKey({ key: vm.publicKeyJwk, format: 'jwk' }) } catch (e) { return fail(`cannot load issuer key: ${e.message}`) }
    const preimage = { ...b }; delete preimage.proof
    const ok = cryptoVerify('sha256', Buffer.from(jcs(preimage), 'utf8'), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(p.proofValue, 'base64url'))
    return ok ? pass : fail('signature does not verify against the issuer key')
  },

  R02(b) {
    const gs = groupsOf(b)
    if (gs.length === 0) return fail('no evidence groups')
    for (const g of gs) {
      const c = g.commitment || {}
      if (c.alg !== 'sha256') return fail(`group ${g.id}: commitment.alg != sha256`)
      if (!/^[0-9a-f]{64}$/.test(c.merkleRoot || '')) return fail(`group ${g.id}: merkleRoot not 64-hex`)
      if (c.artefactIds !== `merkle:sha256:${c.merkleRoot}`) return fail(`group ${g.id}: artefactIds inconsistent with merkleRoot`)
    }
    return pass
  },

  R03(b) {
    for (const g of groupsOf(b)) {
      const root = g.commitment?.merkleRoot
      for (const r of g.revealed || []) {
        if (!verifyMerklePath(leafDigest(r.salt, r.kind, r.observedAt), r.path, root))
          return fail(`group ${g.id}: revealed leaf index ${r.index} does not re-derive to merkleRoot`)
      }
    }
    return pass // vacuous in FULL/summary mode (nothing revealed)
  },

  R04(b, req) {
    const { from, to } = parseWindow(req.params)
    const covering = groupsOf(b).some((g) => dateOf(g.observedFrom) <= from && dateOf(g.observedTo) >= to)
    return covering ? pass : fail(`no evidence group covers ${from}…${to}`)
  },

  R05(b, req) {
    const min = req.params.min ?? 0
    const total = groupsOf(b).reduce((n, g) => n + (Number(g.count) || 0), 0)
    return total >= min ? pass : fail(`count ${total} < required ${min}`)
  },

  R06(b, req) {
    const bad = groupsOf(b).find((g) => g.kind !== req.params.kind)
    return bad ? fail(`group ${bad.id}: kind ${bad.kind} != ${req.params.kind}`) : pass
  },

  R07(b) {
    const gs = groupsOf(b)
    if (gs.length === 0) return fail('no evidence groups')
    const bad = gs.find((g) => !(g.observedFrom <= g.observedTo))
    return bad ? fail(`group ${bad.id}: observedFrom after observedTo`) : pass
  },

  R08(b, req) {
    const { from, to } = parseWindow(req.params)
    for (const g of groupsOf(b)) for (const r of g.revealed || []) {
      const d = dateOf(r.observedAt)
      if (d < from || d > to) return fail(`revealed leaf ${r.index} observedAt ${d} outside ${from}…${to}`)
    }
    return pass
  },

  R09(b) {
    const allowed = new Set([b.issuer, b.credentialSubject?.id, b.credentialSchema?.id].filter(Boolean))
    const foreign = allDids(b).filter((d) => !allowed.has(d))
    return foreign.length ? fail(`third-party DID(s) present: ${foreign.join(', ')}`) : pass
  },

  R10(b) {
    const FORBIDDEN = new Set(['ciphertext', 'payload', 'rawcontent', 'plaintext', 'content', 'artefactcontent'])
    let hit = null
    const walk = (o) => {
      if (hit || !o || typeof o !== 'object') return
      for (const k of Object.keys(o)) { if (FORBIDDEN.has(k.toLowerCase())) { hit = k; return } walk(o[k]) }
    }
    walk(b)
    return hit ? fail(`raw-payload field '${hit}' present — only commitments may be disclosed`) : pass
  },

  R11(b) {
    const FORBIDDEN = new Set(['accounthandle', 'account', 'pairwise', 'pairwisemap', 'linkage', 'handle', 'sovereigndid', 'npub', 'email'])
    const cs = b.credentialSubject || {}
    const hit = Object.keys(cs).find((k) => FORBIDDEN.has(k.toLowerCase()))
    return hit ? fail(`linkage identifier '${hit}' present on credentialSubject`) : pass
  },

  R12(b) {
    const t = b.type || []
    return t.includes('VerifiableCredential') && t.includes('HearthholdAttestation')
      ? pass : fail(`type missing VerifiableCredential/HearthholdAttestation: ${JSON.stringify(t)}`)
  },

  R13(b) {
    return b.credentialSubject?.type === 'HearthholdAttestation'
      ? pass : fail(`credentialSubject.type != HearthholdAttestation (${b.credentialSubject?.type})`)
  },

  R14(b) {
    const ctx = b['@context'] || []
    const hasW3c = ctx.some((c) => typeof c === 'string' && c.includes('/credentials/v2'))
    const hasHl = ctx.includes('https://hearthold.dev/2026/evidence/v1')
    return hasW3c && hasHl ? pass : fail(`@context missing W3C v2 or hearthold evidence context: ${JSON.stringify(ctx)}`)
  },

  async R15(b) {
    const sid = b.credentialSchema?.id
    if (!sid) return fail('credentialSchema.id absent')
    let doc
    try { doc = await resolveDID(sid) } catch (e) { return fail(`schema DID unresolvable: ${e.message}`) }
    const schema = doc?.didDocumentData?.schema
    if (!schema || typeof schema !== 'object') return fail('schema DID does not resolve to a JsonSchema')
    for (const key of schema.required || []) {
      if (!(key in b)) return fail(`bundle missing schema-required top-level '${key}'`)
    }
    return pass
  },

  R16(b) {
    return b.credentialSubject?.descriptionSource === 'machine-derived'
      ? pass : fail(`descriptionSource != machine-derived (${b.credentialSubject?.descriptionSource})`)
  },

  R17(b) {
    const tc = b.credentialSubject?.trustClass
    return tc === 'witnessed' || tc === 'composite' ? pass : fail(`trustClass not witnessed/composite (${tc})`)
  },

  R18(b) {
    return jcs(b.evidence) === jcs(b.credentialSubject?.evidence)
      ? pass : fail('top-level evidence does not match credentialSubject.evidence')
  },

  R19(b) {
    const t1 = b.credentialSubject?.txn
    const t2 = (b.termsOfUse || [])[0]?.txn
    return t1 && t2 && t1 === t2 ? pass : fail(`txn mismatch: subject=${t1} termsOfUse=${t2}`)
  },

  async R20(b) {
    const vm = b.proof?.verificationMethod
    if (!vm) return fail('proof.verificationMethod absent')
    const signer = vm.split('#')[0]
    const frag = '#' + (vm.split('#')[1] || '')
    let doc
    try { doc = await resolveDID(signer) } catch (e) { return fail(`issuer DID unresolvable: ${e.message}`) }
    const am = (doc?.didDocument?.assertionMethod || []).map((x) => (typeof x === 'string' ? x : x?.id || ''))
    const ok = am.some((x) => x === frag || x === vm || x.endsWith(frag))
    return ok ? pass : fail(`issuer key ${frag} not in assertionMethod ${JSON.stringify(am)}`)
  },

  R21(b) {
    const v = b.validUntil
    const t = Date.parse(v)
    if (!v || Number.isNaN(t)) return fail(`validUntil missing/unparseable (${v})`)
    return t > Date.now() ? pass : fail(`validUntil ${v} is not in the future`)
  },

  R22(b) {
    const su = (b.termsOfUse || []).find((u) => u?.type === 'HearthholdSingleUse')
    if (!su) return fail('termsOfUse lacks a HearthholdSingleUse entry')
    return su.txn && String(su.txn).length > 0 ? pass : fail('HearthholdSingleUse entry has empty txn')
  },

  R23(b) {
    const vf = Date.parse(b.validFrom)
    const vu = Date.parse(b.validUntil)
    if (Number.isNaN(vf)) return fail(`validFrom missing/unparseable (${b.validFrom})`)
    if (Number.isNaN(vu)) return fail(`validUntil missing/unparseable (${b.validUntil})`)
    return vf <= vu ? pass : fail('validFrom is after validUntil')
  },
}

// ---------------------------------------------------------------------------
async function main() {
  const [id, bundlePath] = process.argv.slice(2)
  if (!id || !bundlePath) {
    process.stderr.write('usage: node scripts/check-requirement.mjs <id> <bundle.json>\n')
    process.exit(2)
  }
  let census, req, bundle
  try { census = JSON.parse(readFileSync(CENSUS, 'utf8')) } catch (e) {
    process.stderr.write(`cannot read census: ${e.message}\n`); process.exit(2)
  }
  req = census.find((r) => r.id === id)
  if (!req) { process.stderr.write(`unknown requirement id '${id}'\n`); process.exit(2) }
  if (!CHECKS[id]) { process.stderr.write(`no check implemented for '${id}'\n`); process.exit(2) }
  try { bundle = JSON.parse(readFileSync(resolve(bundlePath), 'utf8')) } catch (e) {
    process.stderr.write(`cannot read bundle: ${e.message}\n`); process.exit(2)
  }
  let result
  try { result = await CHECKS[id](bundle, req) } catch (e) { result = fail(`check threw: ${e.message}`) }
  if (result.ok) process.exit(0)
  process.stderr.write(`${id} FAIL (${req.title}): ${result.reason}\n`)
  process.exit(1)
}

main()
