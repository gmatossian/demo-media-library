# Catalog data and API contract

Actual behaviour of the implemented baseline (decisions D1–D8 in
[decisions.md](decisions.md)). The backend is authoritative; the Angular form
mirrors these rules so most problems are caught before saving.

## Catalog entry

| Field | JSON type | Rules |
| --- | --- | --- |
| `id` | number | Server-generated, never reused within a database, immutable. The only identity: duplicate titles and even identical records are allowed. |
| `type` | string | Required. Exactly `BOOK`, `FILM`, or `ALBUM` (case-sensitive). Editable. |
| `title` | string | Required. Trimmed; 1–200 characters after trimming. |
| `creator` | string | Required. Trimmed; 1–200 characters. Free text: author, director, or artist (the UI label follows the type). |
| `releaseYear` | integer or `null` | Optional. `null` when absent — never `""`. Whole number 1000–2100. Strings (`"1999"`, `""`) and fractions (`1999.5`) are rejected. |
| `description` | string or `null` | Optional. Trimmed; blank becomes `null`. At most 2000 characters. Inner whitespace and line breaks are kept. |
| `createdAt` | string | ISO-8601 UTC instant, set by the server on create, immutable. |
| `updatedAt` | string | ISO-8601 UTC instant, set by the server on create and every update. |

**Trimming.** Leading and trailing characters with the Unicode `White_Space`
property are removed (Java `\p{IsWhite_Space}`, JavaScript `\p{White_Space}`), so
non-breaking and ideographic spaces count as whitespace on both sides.
Lengths are counted after trimming in UTF-16 code units (Java `String.length()`,
JavaScript `length`); a character outside the Basic Multilingual Plane, such as
an emoji, counts as 2.

**Plain text.** All text is stored and displayed as plain text. Nothing is
rendered as HTML or Markdown, and no URLs or images are loaded.

## Listing, search, and ordering

`GET /api/entries?q=<text>&type=<TYPE>`

- `q`: optional title search. Trimmed as above; blank means no search. Matches
  when the title contains `q` as a substring, ignoring case (`LOWER` in H2).
  Punctuation matches literally, including `%` and `_`. Accents are not
  normalized (`é` does not match `e`). Only the title is searched.
- `type`: optional, one of `BOOK`, `FILM`, `ALBUM`; anything else is a 400 with
  `errors.type`.
- Both filters combine with AND.
- Order: title ignoring case, then `id` ascending (so duplicates keep creation order).
- No pagination, ranking, or fuzzy matching.

The frontend keeps `q` and `type` in the list URL and cancels an in-flight list
request when a newer one starts, so an older response can never replace results
for the current query. Typing is applied to the URL after a 300 ms pause; typing
not yet applied is dropped when anything else changes the filters — Clear,
Back/Forward, a link, or a reset — so it can never override them. Choosing a type
applies the text typed so far along with it. After Clear, typing the same query
again searches again.

## Endpoints

| Method and path | Success | Errors |
| --- | --- | --- |
| `GET /api/entries` | 200, array of entries | 400 invalid `type` |
| `GET /api/entries/{id}` | 200, entry | 404 missing; 400 non-numeric id |
| `POST /api/entries` | 201, entry, `Location: /api/entries/{id}` | 400 validation |
| `PUT /api/entries/{id}` | 200, updated entry | 400 validation, 404 missing |
| `DELETE /api/entries/{id}` | 204 | 404 missing |
| `POST /api/demo/reset` | 204 | 500 on failure (catalog unchanged) |

`POST` and `PUT` bodies contain only descriptive fields:

```json
{ "type": "FILM", "title": "Glass Harbour", "creator": "Anouk Brevik", "releaseYear": null, "description": null }
```

`PUT` replaces every descriptive field (omitted optional fields become `null`).
`id`, `createdAt`, and `updatedAt` in a request body are ignored. Concurrent edits
are last-write-wins; there is no conflict detection.

## Errors

Errors use RFC 9457 problem details (`Content-Type: application/problem+json`).
Validation errors add `errors`, a map of field name to message:

```json
{
  "title": "Invalid request",
  "status": 400,
  "detail": "Some fields are invalid.",
  "instance": "/api/entries",
  "errors": { "title": "Title is required.", "releaseYear": "Release year must be between 1000 and 2100." }
}
```

A wrong JSON type (e.g. `"releaseYear": ""`) returns the same shape with
`"errors": { "releaseYear": "Value has the wrong type." }`. A missing entry returns
404 with `"title": "Entry not found"`. Unexpected failures return 500 with a generic
message; details go to the backend log only.

## Seed and reset

- Fixtures: [`backend/src/main/resources/fixtures/catalog.json`](../backend/src/main/resources/fixtures/catalog.json),
  12 original fictional entries covering all types, a same-title pair across
  types, an identical duplicate, missing years/descriptions, lower-case titles,
  and titles containing `%`, `_`, and `&`.
- A **new** database is seeded at startup and marked as seeded (`demo_seed` table).
  Ordinary restarts never re-seed, even when the catalog has been emptied.
- **Reset** (`POST /api/demo/reset` or "Reset demo data" in the header) deletes every
  catalog entry and inserts the fixtures in one transaction. If anything fails,
  the transaction rolls back and the catalog is exactly as before. It affects only
  catalog entries. Fixtures receive new ids after each reset (ids are not reused),
  and entries created afterwards continue from there.
- Deleting `backend/data/` while the backend is stopped also yields a fresh,
  seeded database on the next start.

## Frontend behaviour worth knowing

- Routes: `/entries` (list), `/entries/new`, `/entries/:id`, `/entries/:id/edit`;
  `/` redirects to `/entries`; any other path shows "Page not found". A missing or
  malformed entry id shows "Entry not found".
- Save failures keep all input and never retry on their own.
  - **Uncertain** (create or edit): a network failure or any 5xx response,
    including API problem responses and the dev proxy's 502 when the backend is
    down. The form says it could not confirm whether the save happened and links
    to the catalog (create) or the entry (edit, opens in a new tab) so the user can
    check before saving again.
  - **Definite**: 400 validation errors show field and general messages; 404 on
    edit says the entry no longer exists. Nothing was changed in either case.
- Confirmation notices ("Added …", "Saved changes.", "Deleted …", reset) appear
  below the header and clear on the next navigation.
