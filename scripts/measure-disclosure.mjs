#!/usr/bin/env node
// measure-disclosure.mjs — the counting rule for the disclosure-debt seat (D2).
//
//   node scripts/measure-disclosure.mjs <bundle.json>   → one integer on stdout:
//        the byte length of the canonical-JSON serialization of the bundle.
//   node scripts/measure-disclosure.mjs --baseline       → assemble the CURRENT
//        FULL-mode ATTESTATION bundle for the census suite against the seeded
//        reference vault, write it to runs/baseline/bundle.json, print its count.
//   node scripts/measure-disclosure.mjs --self-test       → prove this file's
//        canonicalization is byte-identical to the harness's kappa.mjs.
//
// "Canonical JSON" = recursively sorted keys, no whitespace — the same κ preimage
// every producer and verifier in the harness computes. The counting rule two
// strangers must reproduce (frontier.json authority): the integer is a pure
// function of the bundle bytes, nothing else on stdout.
//
// Zero npm dependencies (node: stdlib only). The one exception is --baseline,
// which dynamically imports the hearthold-linked assembler (assemble-baseline.mjs);
// the counting and self-test paths touch nothing but this file and kappa.mjs.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'

// ---------------------------------------------------------------------------
// canonical JSON: recursively sorted keys, no whitespace.
//
// This is an INDEPENDENT copy of kappa.mjs's canonicalJson, kept here so the
// instance's counting rule is self-contained (the harness ethos: an instance
// runs standing on its own). It MUST stay byte-identical to the shared law — a
// drift between two canonicalizers does not catch itself, it just breaks the
// metric. --self-test is the cross-derivation that catches drift: it imports
// kappa.mjs and asserts both produce the same bytes. If they ever differ, that
// is a finding for PrivacyMage (the κ-alignment check), not something to paper
// over here.
// ---------------------------------------------------------------------------
export function canonicalJson(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']'
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonicalJson(v[k])).join(',') + '}'
}

/** Byte length of the canonical-JSON serialization of `bundle` (UTF-8). */
export function measure(bundle) {
  return Buffer.byteLength(canonicalJson(bundle), 'utf8')
}

const HERE = dirname(fileURLToPath(import.meta.url))
const INSTANCE = resolve(HERE, '..')

// The harness skeleton is a sibling of the instance (../dual-agent-harness), as
// the seat prompts assume. Overridable for non-standard layouts.
function kappaModuleUrl() {
  const root = process.env.HARNESS_ROOT
    ? resolve(process.env.HARNESS_ROOT)
    : resolve(INSTANCE, '..', 'dual-agent-harness')
  return pathToFileURL(join(root, 'tools', 'kappa.mjs')).href
}

// ---------------------------------------------------------------------------
// --self-test: canonicalize a fixture with BOTH implementations, assert equal.
// The fixture deliberately exercises the parts where canonicalizers drift: key
// ordering, nesting, arrays (order preserved, NOT sorted), unicode + escapes,
// integers/floats/negatives, null, booleans, empty containers.
// ---------------------------------------------------------------------------
async function selfTest() {
  const fixture = {
    zeta: 1,
    alpha: { gamma: [3, 2, 1], beta: null, 'a"b\\c': 'x\t\n"y' },
    'ünïcode': 'héllo—世界',
    arr: [{ b: false, a: true }, 2.5, -7, 0, ''],
    empty: {},
    emptyArr: [],
    big: 12345678901234,
  }
  let kappa
  try {
    kappa = (await import(kappaModuleUrl())).canonicalJson
  } catch (e) {
    process.stderr.write(`κ-alignment SELF-TEST could not load kappa.mjs (${e.message}).\n` +
      `Expected the harness skeleton at ../dual-agent-harness (or set HARNESS_ROOT).\n`)
    process.exit(1)
  }
  const mine = canonicalJson(fixture)
  const theirs = kappa(fixture)
  if (mine !== theirs || Buffer.byteLength(mine, 'utf8') !== Buffer.byteLength(theirs, 'utf8')) {
    process.stderr.write('κ-alignment SELF-TEST FAILED — measure-disclosure.mjs and kappa.mjs DISAGREE.\n' +
      'This is a finding for PrivacyMage: the metric is not the κ the harness computes.\n' +
      `  mine:   ${mine}\n  kappa:  ${theirs}\n`)
    process.exit(1)
  }
  process.stderr.write(`κ-alignment SELF-TEST PASS — canonicalization byte-matches kappa.mjs (${Buffer.byteLength(mine, 'utf8')} bytes on the fixture).\n`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// --baseline: assemble the current FULL bundle, persist it, print its count.
// This is the only mode that reaches into hearthold (via assemble-baseline.mjs,
// which imports the built @hearthold/* packages). Kept behind a dynamic import
// so the counting/self-test paths stay zero-dependency.
// ---------------------------------------------------------------------------
async function baseline() {
  let assembleBaselineBundle
  try {
    ({ assembleBaselineBundle } = await import(pathToFileURL(join(HERE, 'assemble-baseline.mjs')).href))
  } catch (e) {
    process.stderr.write(`--baseline needs scripts/assemble-baseline.mjs (the hearthold-linked assembler): ${e.message}\n`)
    process.exit(1)
  }
  const bundle = await assembleBaselineBundle()
  const outDir = join(INSTANCE, 'runs', 'baseline')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'bundle.json')
  // Persist the canonical bytes so the number is reproducible from the file too.
  writeFileSync(outPath, canonicalJson(bundle) + '\n')
  process.stderr.write(`wrote ${outPath}\n`)
  process.stdout.write(String(measure(bundle)) + '\n')
}

async function main() {
  const arg = process.argv[2]
  if (arg === '--self-test') return selfTest()
  if (arg === '--baseline') return baseline()
  if (!arg || arg.startsWith('--')) {
    process.stderr.write('usage: node scripts/measure-disclosure.mjs <bundle.json> | --baseline | --self-test\n')
    process.exit(2)
  }
  let bundle
  try {
    bundle = JSON.parse(readFileSync(resolve(arg), 'utf8'))
  } catch (e) {
    process.stderr.write(`cannot read/parse bundle ${arg}: ${e.message}\n`)
    process.exit(2)
  }
  process.stdout.write(String(measure(bundle)) + '\n')
}

// Only run as a CLI; importable (measure/canonicalJson) without side effects.
if (import.meta.url === `file://${process.argv[1]}`) main()
