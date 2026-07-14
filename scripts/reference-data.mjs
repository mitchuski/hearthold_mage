#!/usr/bin/env node
// reference-data.mjs — the deterministic content of the reference vault (D4).
//
// Pure, zero-dependency, hearthold-free: given nothing but its own constants it
// emits the SAME artefacts every time — fixed ids, fixed timestamps, fixed
// synthetic payloads. That determinism is what makes the disclosure-debt
// baseline a number two strangers reproduce (frontier.json authority): the
// evidence window, the observation count, and the merkle leaves are all fixed
// here, so the only non-determinism left in the bundle is the issuer identity
// and its signature (handled by seed-reference-vault.mjs).
//
// Run directly to print a summary (counts + window) for eyeballing:
//   node scripts/reference-data.mjs

// The census window (docs/HARNESS-SEAT-BRIEF.md R03), at DATE granularity — the
// "requested period" a relying party demands coverage of. All observations fall
// within it, so R07 (no out-of-window leaf) holds by construction.
export const CENSUS_WINDOW = { from: '2026-01-01', to: '2026-06-30' }

// The SELECTION window passed to assembleEvidence. hearthold's selectArtefacts
// does a raw string compare `observedAt > spec.to`, so a bare date `2026-06-30`
// would EXCLUDE a 2026-06-30T12:00Z observation. End-of-day `to` includes the
// whole last day, so the evidence group's observedTo lands on 2026-06-30 and the
// bundle provably covers the requested period (R03). from needs no such nudge.
export const SELECT_WINDOW = { from: CENSUS_WINDOW.from, to: `${CENSUS_WINDOW.to}T23:59:59Z` }

// Inclusive day span of H1-2026 used to place observations: Jan 1 … Jun 29
// (181 days). 142 location observations are spread deterministically across it.
const LOCATION_COUNT = 142
const WINDOW_DAYS = 180 // Jan 1 + 0..180 → last obs on ~Jun 30; kept < Jun 30 end-of-day

// A fixed synthetic track: 12 recurring "places" the subject is seen at, cycled
// deterministically. Values are opaque (they get sealed + hashed) — they only
// need to be stable, not meaningful.
const PLACES = [
  'home', 'office', 'gym', 'market', 'clinic', 'library',
  'station', 'park', 'cafe', 'school', 'harbor', 'depot',
]

const pad = (n, w) => String(n).padStart(w, '0')

/** Deterministic ISO instant `d` days after 2026-01-01T00:00:00Z, at 12:00:00Z. */
function dayInstant(d) {
  // Compute the calendar date without Date.now(): 2026 is not a leap year until
  // Feb has 28 days; use a fixed month-length table for H1-2026.
  const MONTHS = [31, 28, 31, 30, 31, 30] // Jan..Jun 2026
  let rem = d
  let month = 0
  while (month < MONTHS.length && rem >= MONTHS[month]) { rem -= MONTHS[month]; month++ }
  const mm = pad(month + 1, 2)
  const dd = pad(rem + 1, 2)
  return `2026-${mm}-${dd}T12:00:00Z`
}

/**
 * The reference artefacts, as neutral records (no hearthold types):
 *   { id, kind, observedAt, sensitivity, witness, payload }
 * seed-reference-vault.mjs maps sensitivity → the Sensitivity enum and seals
 * `payload` into the vault. `witness: 'self'` (never a third-party DID) is what
 * keeps the bundle free of foreign identifiers (R08, absence claim).
 */
export function referenceArtefacts() {
  const out = []
  for (let i = 0; i < LOCATION_COUNT; i++) {
    // Even, deterministic spread across the window; floor keeps every day in-range.
    const day = Math.floor((i * WINDOW_DAYS) / (LOCATION_COUNT - 1))
    out.push({
      id: `loc-${pad(i, 4)}`,
      kind: 'location',
      observedAt: dayInstant(day),
      sensitivity: 'LOW',
      witness: 'self',
      payload: `place=${PLACES[i % PLACES.length]};seq=${i}`,
    })
  }
  // A handful of document artefacts (a different kind in the same vault; NOT part
  // of the location evidence group, so they don't perturb the census counts).
  const DOCS = ['lease-summary', 'utility-statement', 'travel-itinerary']
  DOCS.forEach((name, j) => {
    out.push({
      id: `doc-${pad(j, 4)}`,
      kind: 'document',
      observedAt: dayInstant(15 + j * 40),
      sensitivity: 'LOW',
      witness: 'self',
      payload: `doc=${name}`,
    })
  })
  return out
}

/** The location subset, sorted ascending by observedAt — the evidence group's members. */
export function locationArtefacts() {
  return referenceArtefacts()
    .filter((a) => a.kind === 'location')
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
}

/** Facts the census is written against — derived from the data, not asserted. */
export function referenceFacts() {
  const locs = locationArtefacts()
  return {
    window: CENSUS_WINDOW,
    locationCount: locs.length,
    observedFrom: locs[0].observedAt,
    observedTo: locs[locs.length - 1].observedAt,
  }
}

// Fixed seed for the deterministic merkle salts (passed to assembleEvidence).
export const SALT_SEED = 'hearthold-mage-reference-vault-v1'

// The claim the reference attestation asserts (fixed text → fixed bytes).
export const REFERENCE_CLAIM = 'Resided in the census region throughout 2026-H1'
export const REFERENCE_STRUCTURED = { region: 'census', period: '2026-H1' }
// Fixed txn + validUntil so the bundle is byte-stable (no randomUUID, no now()).
export const REFERENCE_TXN = 'urn:hearthold:txn:reference-0001'
export const REFERENCE_VALID_UNTIL = '2027-01-01T00:00:00Z'

if (import.meta.url === `file://${process.argv[1]}`) {
  const f = referenceFacts()
  process.stdout.write(
    `reference vault content (deterministic):\n` +
      `  location observations: ${f.locationCount}\n` +
      `  window:                ${f.window.from} … ${f.window.to}\n` +
      `  observedFrom:          ${f.observedFrom}\n` +
      `  observedTo:            ${f.observedTo}\n` +
      `  documents:             ${referenceArtefacts().filter((a) => a.kind === 'document').length}\n`,
  )
}
