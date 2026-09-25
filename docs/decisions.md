# Decision register

First recorded 2026-09-25 with the documentation-only delivery. Initial refinement
decisions below were accepted by Gabriel on 2026-09-25 (S1, S2, D1–D11 with his
clarifications). Implementation-time decisions are listed separately.

## Accepted direction

- A separate media-library demo repository for later learning and ExecDesk dogfooding.
- Build basic capabilities first; learning exercises come afterward.
- Exercise work need not be committed or promoted into the baseline.
- Readable, maintainable code and proportionate checks.
- Human control over consequential choices and final acceptance unless delegated.

## Scope and stack — accepted 2026-09-25 (Gabriel)

- **S1 Scope.** A descriptive catalog of books, films, and music albums with
  browse/detail, create/edit/delete, title search, type filtering, and seed/reset.
  No media files, playback, downloads, external metadata lookup, lending or
  physical-copy tracking, or accounts. One shared catalog; anyone using it may
  edit or delete records.
- **S2 Stack.** Angular (`frontend/`) and one Spring Boot HTTP/JSON service
  (`backend/`, Java 25, Maven wrapper). During development the Angular dev server
  proxies `/api` to the backend; the backend listens on localhost only. Resolved
  versions are recorded in the README.

## Baseline choices — accepted 2026-09-25 (Gabriel)

| # | Topic | Accepted decision |
| --- | --- | --- |
| D1 | Fields | `id` (server-generated number), `type` (BOOK, FILM, ALBUM), `title` (required, ≤200), `creator` (required, ≤200, free text), `releaseYear` (optional integer 1000–2100), `description` (optional, ≤2000, line breaks preserved), server-set `createdAt`/`updatedAt` (UTC). One `creator` field; the UI labels it Author, Director, or Artist by type. |
| D2 | Input rules | Leading/trailing whitespace is trimmed with the same rule on frontend and backend (Unicode `White_Space` characters). Blank after trimming means missing: required fields fail, optional text is stored as `null`. An absent release year is `null`, never an empty string. The backend is authoritative; the UI mirrors its rules. Limits count UTF-16 code units after trimming (the native length in both JS and Java). User text is always rendered as plain text. |
| D3 | Duplicates | Allowed, including identical records; `id` is the only identity. |
| D4 | Discovery | Server-side filtering. Case-insensitive substring match on title only; no accent normalization; punctuation, including `%` and `_`, matches literally. A blank query means no search. Optional type filter combined with AND. Ordered by title (case-insensitive), then `id`. Live search (debounced) with query and type kept in the URL; a Clear action. An older response must never overwrite results for the current query. No ranking or pagination. |
| D5 | Editing | Only descriptive fields (type, title, creator, release year, description) are editable, as a full replacement. `id` and `createdAt` are immutable; `updatedAt` is controlled by the server. Last write wins (conflict detection is an optional exercise). Cancel leaves without saving; no unsaved-changes prompt. |
| D6 | Delete and failures | Delete from the detail view with an in-page confirmation; then return to the list with a notice. Failed saves keep the entered input and show field/general errors; Save is disabled while in flight. An uncertain create outcome is not retried automatically; the user is asked to check the catalog. |
| D7 | Persistence | File-backed H2 in gitignored `backend/data/`; data survives restarts. Spring JDBC (plain SQL, no ORM) with a Flyway migration for the schema. |
| D8 | Seed/reset | ~12 original fictional fixtures in source control covering all types, duplicates, and missing optional fields. Seeded only when the database is new — not on ordinary restarts, even if the catalog was emptied. Reset via an unobtrusive UI action with confirmation and `POST /api/demo/reset`. Reset is atomic: it replaces all catalog entries with the fixtures or changes nothing. Fixed fixture IDs and restarting the ID counter are *not* required; creating entries after reset must work. |
| D9 | Screens | `/entries` list (table) with search/type toolbar, result count, and Add; `/entries/new` and `/entries/:id/edit` share one form; `/entries/:id` detail. Unknown routes and missing records have distinct not-found results. Empty catalog and no-match states are distinct. |
| D10 | Visual | Plain CSS, light theme, system font, one accent colour, type shown as a text badge, no images. A visible "demo only — fictional data" label. |
| D11 | Verification | Focused backend tests (validation, search/filter/ordering, duplicate identity, missing records, reset atomicity and post-reset creation, restart durability) plus a browser walkthrough against the real backend. No broad frontend unit-test suite. |

## Implementation-time decisions

Routine choices made while building, within the accepted decisions above. Listed
so they can be reviewed; none changes scope.

- Resolved versions: Spring Boot 4.1.1, Angular 22.2.0 (latest stable on 2026-09-25).
- Error responses use RFC 9457 problem details (`application/problem+json`);
  validation failures add an `errors` object mapping field name to message.
- Request bodies are strict about types: `releaseYear` must be a JSON integer or
  `null` (strings, including `""`, and fractional numbers are rejected). Read-only
  properties sent in a request body (`id`, `createdAt`, `updatedAt`) are ignored.
- The search query itself is trimmed with the D2 rule before matching.
- Fixtures are stored as JSON and inserted through the same validation rules as
  user input. A one-row marker table records that the database was seeded, so an
  emptied catalog is not re-seeded on restart.
- Reset deletes and re-inserts in one transaction and does not restart the id
  counter, so fixtures get new ids after each reset and ids are never reused
  (per the D8 clarification). Old links to pre-reset entries show "not found".
- Focused frontend tests cover rules a manual walkthrough cannot check reliably:
  the D4 stale-response rule, and (after the follow-up) F1 search coordination and
  F2 save-failure classification. There is no broad component test suite.
  The CLI's generated app test (which checked scaffold content) was removed.
- ~~"Uncertain create outcome" (D6) means no response, or a 5xx that is not an API
  problem response.~~ Superseded by Gabriel's follow-up below.
- The release-year input is a text field with a numeric keyboard hint, not
  `type="number"`, so malformed input is reported rather than silently becoming `null`.
- Confirmation notices are shown by the app shell and cleared on the next
  navigation (including filter changes).
- An unknown `type` in the list URL is treated as "All types" by the frontend; the
  API itself rejects it with 400. A non-numeric entry id in a route shows "Entry
  not found" without calling the API.
- ~~Default ports stay 8080 (backend) and 4200 (frontend).~~ Superseded below.
- Flyway warns that Spring Boot's managed H2 (2.4.240) is newer than its verified
  H2 version. Left as resolved by Spring Boot; migrations and tests pass.

## Follow-up decisions — 2026-09-25 (Gabriel)

- **F1 Search coordination.** Clear cancels typing not yet applied; the same query
  can be searched again after Clear; Back/Forward (and any navigation the filter
  controls did not start) wins over pending typing and the controls show the
  restored URL. Covered by regression tests in `entry-list.spec.ts`.
- **F2 Uncertain saves.** Network failures and all 5xx responses — including API
  problem responses — are uncertain outcomes for both create and edit. Input is
  kept and the user is advised to check the catalog/entry before retrying.
  Validation (400) and missing-record (404) failures remain definite.
- **F3 Ports.** Defaults are 4303 (frontend dev server) and 8083 (backend), with the
  proxy pointing at `127.0.0.1:8083`.

## Record maintenance and authority

Record material answers with date and who accepted or was delegated the choice.
Update the affected specification/checklist. Do not convert suggestions into
agreements simply because implementation has begun. Git delivery, external issue creation, deployment, and visibility changes require
separate authority; the initial baseline delivery authorization is recorded below.

## Baseline delivery authorization — 2026-09-25

Gabriel authorized committing and pushing the reviewed baseline, with a merge only
if the work was on a separate branch. The work was already on main. This authority
is specific to the initial baseline delivery; it does not grant standing permission
to merge exercise solutions, publish/deploy, or change repository visibility.
Hands-on acceptance remains separate from this delivery checkpoint.

## Public sharing — 2026-09-25

Gabriel authorized making this repository public after checking for secrets,
sensitive data, and machine-specific paths, superseding the earlier private-only
publication boundary. Preparation removes local checkout paths and incidental
process identifiers from documentation where present. Git history must be checked
as well as the current files before changing visibility. Public source availability
does not authorize deployment or promotion of exercise solutions into main.
