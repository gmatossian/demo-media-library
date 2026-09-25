# Acceptance and proportionate verification

Checklist for the accepted catalog baseline. This is not a production
certification or a test-per-row requirement.

**Status 2026-09-25:** implementation verified by Claude as noted below; human
acceptance by Gabriel is still pending. Evidence key: **T** = automated test
(`backend` via `./mvnw test`, `frontend` via `npm test -- --watch=false`),
**W** = browser walkthrough against the real backend (Angular dev server + Spring
Boot, disposable data directory), **C** = command run and output checked.

## Observable outcomes

- [x] Browse, details, create, edit, and confirmed deletion work end to end. *W; T (`CatalogApiTest`).*
- [x] All supported media types and agreed optional fields display correctly. *W: Book/Film/Album badges, creator label per type, "Not recorded" year, "No description", line breaks kept.*
- [x] Invalid/blank inputs and year/type limits are consistent across UI and API. *T (`EntryValidatorTest`, `CatalogApiTest`: trimming incl. Unicode spaces, limits after trim, year bounds, `""`/`"1999"`/`1999.5` rejected); W (same messages in the form).*
- [x] Title search and type filter follow the agreed matching rules together;
  clearing controls restores results and ordering is deterministic. *T (literal `%`/`_`, case, trim, AND, title-then-id order; `entry-list.spec.ts`: Clear cancels pending typing, same query after Clear, Back/Forward win over pending typing); W (live search, URL state, refresh, back/forward, Clear).*
- [x] Empty catalog and no matching results have clear, distinct feedback. *W.*
- [x] Duplicate records, if allowed, retain independent IDs and edits/deletions. *T (`duplicateEntriesKeepIndependentIdentity`); fixtures include an identical pair.*
- [x] Cancelling changes preserves saved data; failed saves preserve entered input. *W: cancel after editing; save with backend stopped kept every field.*
- [x] Loading, missing-record, validation, and service errors are understandable;
  uncertain creation outcomes are not automatically retried. *W: backend stopped → one POST (502), "could not confirm whether the entry was saved" message, no retry. T (`entry-form.spec.ts`): network failure, API 500, and 502 are uncertain for create and edit with input kept and no retry; 400 and 404 stay definite.*
- [x] Direct links, browser refresh/navigation, and missing routes behave as documented. *W: `/entries/1`, `/entries/9999`, `/entries/abc/edit`, `/no/such/page`, refresh with filters, back/forward.*
- [x] User-entered text remains plain text; controls are labelled and keyboard usable. *W: `<b>`/`<script>` title rendered as text; labels linked; errors linked via `aria-describedby`; focus moves to first invalid field and to Cancel in confirmations; delete cancelled with the keyboard.* Not checked with a screen reader.
- [x] App and README show demo purpose, with original fictional fixtures. *W; fixtures in `backend/src/main/resources/fixtures/catalog.json` (invented; not checked against every real-world title).*
- [x] Seed/reset matches the agreed policy and scope; ordinary startup preserves data. *T (`RestartDurabilityTest`, `DemoResetTest` incl. a simulated failure mid-reset leaving the catalog unchanged); W (UI reset); C (API reset, delete-`data/` reset).*
- [x] Changes survive backend restarts if durable persistence is accepted. *T; C (default `./mvnw spring-boot:run`, create, restart, entry present).*
- [x] Creating records after reset works without fixture-ID collisions. *T; C.*

## Maintainability and reproducibility

- [x] A fresh checkout builds/runs with the documented prerequisites and commands. *C: `npm ci`, `npm test`, `npm run build`, `./mvnw test`, `./mvnw spring-boot:run`, `npm start` (4303 → proxy → 8083, verified while another project's dev server kept running on 4200). Not tried on a second machine or a clean clone.*
- [x] Focused files separate UI, HTTP handling, catalog rules, and persistence.
- [x] Actual capabilities, data/API contract, reset scope, and limitations are documented. *README, [catalog-contract.md](catalog-contract.md).*
- [x] Runtime data, generated output, and local secrets are excluded appropriately. *`.gitignore` covers `backend/data/`, `backend/target/`; `frontend/.gitignore` covers `node_modules`, `dist`, `.angular`. No secrets exist.*
- [x] No optional exercise or unrequested media processing has entered the baseline.

## Verification effort

Use a short browser walkthrough against the real backend if adopted, plus focused
automated checks where they establish meaningful behaviour: validation, combined
search/filter rules, CRUD identity, missing records, and seed/reset are candidates.
Do not add tests that merely mirror implementation, a blanket coverage target,
or an exhaustive platform/browser matrix.

Record actual commands and outcomes. Identify blocked or omitted checks honestly;
a passing build does not establish that user flows work. Reset checks must use
explicitly disposable demo data, not erase existing work as cleanup.

## Final review checkpoint

Give Gabriel verified run/reset instructions, implemented capabilities and scope
differences, evidence and limits, material decisions made, working-tree status,
and exactly what acceptance or decision remains. Do not claim human acceptance
or Git delivery just because implementation is complete.
