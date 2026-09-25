# Media library — frontend

Angular 22 client for the demo catalog. Setup, run, test, and reset instructions
are in the [repository README](../README.md); the data and API contract is in
[docs/catalog-contract.md](../docs/catalog-contract.md).

Source layout (`src/app/`):

| Path | Contents |
| --- | --- |
| `catalog/entry-list/` | Catalog table, search/type filters synced to the URL, list loading state; tests for stale responses and search/URL coordination. |
| `catalog/entry-detail/` | Entry details and delete confirmation. |
| `catalog/entry-form/` | Shared create/edit form and field validators; tests for save-failure handling. |
| `catalog/` | Entry types and labels, API client, whitespace and length rules mirroring the backend, entry loading. |
| `demo/` | Demo-data reset control and API. |
| `shared/` | Error parsing, confirmation notices, not-found page. |
