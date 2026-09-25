# Baseline specification

Status (2026-09-25): scope and details accepted by Gabriel (S1, S2, D1–D11 in
[decisions.md](decisions.md)) and B1–B8 implemented, pending Gabriel's review and
acceptance. The settled behaviour is recorded in
[catalog-contract.md](catalog-contract.md); the sections below are the original
specification.

## Capabilities

| ID | Capability | Observable outcome |
| --- | --- | --- |
| B1 | Browse | A catalog list displays title, media type, creator/credit, and release year when present. |
| B2 | Inspect | A dedicated detail view displays the complete descriptive record; direct links survive refresh; missing records have an understandable result. |
| B3 | Add | A form accepts agreed fields and creates one catalog record visible in the list/detail views. No media file is uploaded. |
| B4 | Edit | Change agreed fields on an existing record; successful saves appear consistently. Cancelling does not save edits. |
| B5 | Delete | Explicit confirmation removes the selected record; cancelling preserves it. Its old link then resolves as missing. |
| B6 | Find | Title search and media-type filtering work together; clearing them restores the list. Empty catalog and no matching results are distinct states. |
| B7 | Seed/reset | Fresh setup supplies known fictional records across all supported types. Explicit reset restores the dataset without touching source files or unrelated data. |
| B8 | Understand state | Loading, validation, empty, missing-record, and service errors are visible; failed saves preserve input; demo-only use is clear. |

## Behaviour to settle

All of the following were settled on 2026-09-25; see [catalog-contract.md](catalog-contract.md).

- Shared fields and exact limits: required title/creator/type, optional year and
  description are proposed. Decide whitespace handling, character counting,
  allowed years, and missing optional values consistently across UI/API/storage.
- Proposed generic creator/credit is descriptive text (author, director, or artist);
  it is not an account or a separate managed creator entity.
- Render text as plain text; preserve agreed description formatting. No HTML or
  Markdown rendering, image URLs, or external media loading is presumed.
- Use stable IDs, not title uniqueness, to identify records. If duplicates are
  allowed, editing/deleting one must leave the other untouched.
- Define case handling and deterministic ordering precisely enough that UI and
  backend agree. A blank search acts as no search; type and query combine with AND.
- Define which side performs filtering. Do not maintain two conflicting versions
  of search behaviour or introduce a search engine for this baseline.
- Save failures must not erase entered values or pretend success. For an uncertain
  network outcome, do not blindly retry creation; let the person inspect the catalog.
- Seed on fresh initialization, preserve data on ordinary restarts, reset only
  explicitly. Creating a record after reset must not collide with fixture IDs.
- Confirm navigation, cancel/delete flows, and a compact visual direction before
  consequential UI decisions are implemented.

## Exclusions (accepted)

Media file upload/storage, streaming/playback, transcoding, cover downloads,
external metadata APIs, scraping, accounts/roles, lending/physical-copy tracking,
tags, ratings/reviews, progress tracking, collections/playlists, recommendations,
fuzzy/full-text search, bulk import/export, pagination, real-time updates, and
production deployment.

Some exclusions are useful future exercises; none should be implemented just to
make the baseline more impressive. Basic keyboard access, labelled controls, safe
text rendering, understandable errors, and consistent CRUD belong in the baseline.

After implementation, document actual supported capabilities and limitations.
Record a baseline revision only after acceptance and authorized Git delivery;
exercise solutions do not automatically change it.
