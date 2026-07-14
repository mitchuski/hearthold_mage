# Registry cleanup — reference-vault fixtures

Per REGISTRY-HYGIENE-BRIEF §5 and Fable's seat review (2026-07-13): the reference
vault was first built before `HEARTHOLD_REGISTRY=local` was wired, so these DIDs
were registered on the **public hyperswarm** registry. Revoked with
`scripts/cleanup-fixtures.mjs`. Revocation marks them dead (agents have no
`validUntil`; the gossip log does not shrink) so a future GC/filter can prune them.

## Revoked (2026-07-13) — all were `hyperswarm`

| label | did |
|---|---|
| warden agent (root A) | `did:cid:bagaaierafkn5eexamtrjnsst4duam7k7x4gogr2p26srj5uql3mhv54ywzvq` |
| sovereign agent (root A) | `did:cid:bagaaieras4mwj5yematcsl7tvtjlro7w7j2ca2ktslcj6lz6gvqxuzydj7ia` |
| HearthholdAttestation schema (root A) | `did:cid:bagaaieraz64lqisbmlhstzcsiqghp2zaurxm5ts43ckh6h6qo6ur4camlrja` |
| warden agent (root B / stranger) | `did:cid:bagaaiera6vnlxv7dsd7aqgq4jvqgdhgup4c3xdxufb76q3u267myi6o6ateq` |
| sovereign agent (root B / stranger) | `did:cid:bagaaierawsijowtarkwp35zc7mu2d5rdzxoj2bgvhfhunob6vvxcyi7dhbpa` |
| HearthholdAttestation schema (root B) | `did:cid:bagaaierax5oqy2kjbxo4koh6x63c325raevl2c4nib2rtohp4zqxcaxhyuaq` |

**Total: 6 revoked, 0 errors** (4 agents + 2 schema assets).

## Not revoked — the attestation credential assets

Repeated `--baseline` / `self-test` runs each minted a fresh `HearthholdAttestation`
credential asset on hyperswarm (createAsset via the instance default registry).
These are **not enumerable from the wallet after the fact** (`listAssets`/`listIssued`
do not return self-issued VCs, and the credential DIDs were not persisted). They are
assets, not agents, so they fall under the asset-GC disposal path — filed for
macterra with the brief's §5 disposal question. Estimated ~6 credential assets.

## Blocker — RESOLVED 2026-07-13

The flaxlap node originally did not expose the `local` registry
(`ARCHON_GATEKEEPER_REGISTRIES=hyperswarm` overrode the code default
`['local','hyperswarm']`, archon `packages/gatekeeper/src/gatekeeper.ts:94`), so the
hygienic seed path correctly **failed loud** rather than falling back to mainnet.
flaxscrip enabled `local` on flaxlap; the node now reports
`[...,"local"]`. The reference vault was re-seeded and re-measured under `local`:
the baseline **2049 bytes reproduces**, and `scripts/self-test.mjs` confirms every
seed DID (issuer, subject, schema) resolves `registration.registry==='local'`. The
frozen baseline is now the product of the hygienic path, not merely equal to it.
