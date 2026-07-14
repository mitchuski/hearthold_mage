# Sources

Trace or delete (GR-9): nothing is citable unless it resolves through this
registry to a concrete path or reference.

Evidence classes:

- **E-RUN** — output produced in this repo; path to the run dir or log.
- **E-DOC** — a document in this repo; path.
- **E-EXT** — external source; stable reference (URL, DOI, spec name).

| slug | class | resolves to | note |
|---|---|---|---|
| baseline-run | E-RUN | runs/baseline/bundle.json | the FULL-mode reference bundle; `measure-disclosure.mjs --baseline` → 2049 |
| self-test | E-RUN | scripts/self-test.mjs | canary 23/23 + 14 negatives refused (run at acceptance) |
| census | E-DOC | census/requirements.json | 23 frozen requirements; sha in census/FROZEN.md |
| census-design | E-DOC | census/DESIGN.md | provenance + absence-claim audit trail for the gate |
| seat-brief | E-DOC | ../hearthold/HARNESS-SEAT-BRIEF.md | the build brief these deliverables satisfy |
