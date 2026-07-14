// hearthold.mjs — the single seam where the instance reaches into the built
// hearthold monorepo. Only --baseline (measure) and the seed/assemble scripts
// import this; the relying-party gate (check-requirement.mjs) MUST NOT — that
// is the verifier boundary (HARNESS-SEAT-BRIEF §D3).
//
// Absolute file: imports against the built ~/hearthold (precedent: Sevenfold's
// package linking). Transitive @hearthold/* and @didcid/* resolve through the
// hearthold workspace's node_modules, so nothing is installed here.

import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

export const HEARTHOLD_HOME =
  process.env.HEARTHOLD_HOME || join(process.env.HOME, 'hearthold')

const url = (rel) => pathToFileURL(join(HEARTHOLD_HOME, rel)).href

export const core = await import(url('packages/core/dist/index.js'))
export const { VaultStore } = await import(url('packages/warden/dist/store.js'))
