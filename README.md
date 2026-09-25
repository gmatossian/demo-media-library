# demo-media-library

**Demo and learning purposes only. Not intended for production use.**

A familiar media-library system built as a reusable starting point for later
practice exercises and ExecDesk dogfooding. Exercise solutions need not become
permanent changes to the baseline.

## What it is

A small catalog of **books, films, and music albums**. It stores descriptive
records only: there are no media files, uploads, playback, streaming, downloads,
external metadata lookups, or accounts. All titles and creators are original and
fictional. Everyone using a running instance shares one catalog and can edit it.

Supported today:

- **Browse** the catalog as a table (title, type, creator, year), sorted by title.
- **Search** titles (case-insensitive substring, punctuation literal) and **filter**
  by type; both combine, live as you type, and are kept in the URL.
- **View** an entry's full details at a stable link (`/entries/:id`).
- **Add** and **edit** entries through one validated form; **delete** with an
  in-page confirmation.
- **Reset** to the sample catalog from the header (with confirmation) or the API.
- Clear loading, empty-catalog, no-match, validation, not-found, and service-error states.

Exact fields, validation, search semantics, and the HTTP API are in
[docs/catalog-contract.md](docs/catalog-contract.md).

## Prerequisites

| Tool | Version used | Notes |
| --- | --- | --- |
| JDK | 25 (`java` on `PATH` or `JAVA_HOME`) | Verified with OpenJDK 25.0.4. Maven is not needed: the backend includes the Maven wrapper. |
| Node.js | `^22.22.3`, `^24.15.0`, or `>=26` (Angular 22's range) | Verified with Node 24.20.0 and npm 11.19.0. `npm ci` may print an `install-scripts` warning about an optional native package; it does not affect the build or tests. |

Resolved framework versions: Spring Boot 4.1.1 (with its managed H2 2.4.240 and
Flyway), Angular 22.2.0, TypeScript 6.0, Vitest 5. Nothing is installed globally;
the Angular CLI runs from `frontend/node_modules`.

## Run it locally

One-time setup:

```bash
cd frontend && npm ci
```

Start the backend (terminal 1). It listens on `http://127.0.0.1:8083` (this machine only):

```bash
cd backend && ./mvnw spring-boot:run
```

Start the frontend (terminal 2), then open http://localhost:4303:

```bash
cd frontend && npm start
```

The Angular dev server (port 4303, set in `frontend/angular.json`) forwards `/api`
to this project's backend at `127.0.0.1:8083` (`frontend/proxy.conf.json`). The
ports were chosen to avoid the usual 4200/8080 defaults of other local demos; if
you change the backend port (`server.port` in
`backend/src/main/resources/application.properties`), change the proxy target too.

**Stop:** press `Ctrl+C` in each terminal. Data is kept.

## Data and reset

- Runtime data lives in `backend/data/` (an H2 database file), created on the first
  backend start. It is gitignored. The path is relative to the directory the
  backend is started from, so start it from `backend/` as shown.
- A **new** database is seeded with 12 fictional entries from
  `backend/src/main/resources/fixtures/catalog.json`. Normal restarts keep your
  data and never re-seed — even if you deleted every entry.
- **Reset to the sample catalog** (replaces *all* catalog entries; changes nothing else):
  - In the app: **Reset demo data** in the header, then confirm.
  - Via the API, with the backend running:

    ```bash
    curl -X POST http://127.0.0.1:8083/api/demo/reset
    ```

  Reset is all-or-nothing: if it fails, the catalog is left exactly as it was.
- **Start completely fresh:** stop the backend, delete `backend/data/`, and start
  it again.

## Checks

```bash
cd backend && ./mvnw test
```

```bash
cd frontend && npm test -- --watch=false
```

```bash
cd frontend && npm run build
```

Backend tests (19) cover validation, search/filter/ordering, duplicate identity,
missing records, reset atomicity and creation after reset, and seeding/durability
across real restarts. They use in-memory or temporary databases and never touch
`backend/data/`. Frontend tests (16) cover stale list responses, search/URL
coordination (Clear, re-entering a query, Back/Forward), and how save failures
are classified (uncertain vs definite) with input kept.
User flows were verified by a browser walkthrough; see the checklist in
[docs/acceptance.md](docs/acceptance.md).

## Project layout

```text
backend/    Spring Boot service (Java 25, Maven wrapper)
  src/main/java/demo/medialibrary/
    catalog/   entry model, validation rules, service, SQL repository, REST controller
    demo/      fixtures, seeding, and reset
    web/       error responses (RFC 9457 problem details)
  src/main/resources/
    db/migration/  Flyway schema
    fixtures/      sample catalog (JSON)
frontend/   Angular 22 app
  src/app/
    catalog/   list, detail, and form views; API client; shared text rules
    demo/      reset control
    shared/    error parsing, notices, not-found page
docs/       decisions, contract, specification, acceptance, exercises
```

## Known limitations

- Local demo only: no authentication, authorization, HTTPS, or deployment setup.
  The backend binds to 127.0.0.1.
- Last write wins when two people edit the same entry (conflict detection is an
  optional exercise). No pagination; the whole matching list is returned.
- Search covers titles only and does not normalize accents.
- Timestamps are shown in the browser's local time zone and English date format.
- Flyway logs a warning that H2 2.4.240 (the version Spring Boot manages) is newer
  than the latest H2 version Flyway lists as verified. Migrations and all tests
  work; the versions were left as Spring Boot resolves them.
- Development servers only: there is no packaged single-process build.
- Light theme only; plain CSS without a component library.

## Documentation

| Document | Purpose |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Working instructions and authority boundaries. |
| [Product brief](docs/product-brief.md) | Purpose and meaning of "media library". |
| [Decision register](docs/decisions.md) | Accepted decisions (2026-09-25) and implementation-time choices. |
| [Catalog contract](docs/catalog-contract.md) | Fields, rules, search, API, errors, seed/reset. |
| [Baseline specification](docs/baseline-spec.md) | Capabilities and behaviour. |
| [Implementation brief](docs/implementation-brief.md) | Original delegation brief. |
| [Acceptance](docs/acceptance.md) | Outcomes and verification evidence. |
| [Optional exercises](docs/exercises.md) | Future task ideas, not baseline work. |
| [Handoff prompt](docs/handoff-prompt.md) | Original prompt for the build. |

This is a demo intended for public sharing, not a hosted or production-ready
service. Implementation complete, human acceptance, and Git delivery are
separate states: on 2026-09-25 Gabriel authorized committing and pushing the
implemented baseline. Hands-on acceptance remains separate; this is not a
production release.
