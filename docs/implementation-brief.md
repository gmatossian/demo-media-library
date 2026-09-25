# Delegation brief — build the baseline

## Desired result

A usable local media-library baseline with fictional catalog data, readable code,
repeatable setup/reset, and proportionate verification. It is a starting point for
later exercises, not a production media service.

## First engagement

Read the pack and inspect the actual checkout. Confirm the catalog interpretation,
scope, and stack from [decisions.md](decisions.md). Present a compact recommendation
for unresolved fields, search/edit rules, UX, and persistence with alternatives
where consequential. Ask Gabriel before implementing dependent work.

A short screen outline and technical outline are enough. Do not build an elaborate
roadmap or reopen accepted choices without a blocker. Once required choices are
settled and implementation is authorized, proceed through routine implementation,
documentation, and verification without repeated confirmation. New consequential
choices still require a decision. Git delivery remains separately authorized.

## Proposed structure and implementation guidance

If Angular and Spring Boot are adopted:

    frontend/    Angular app, feature components, forms, API access
    backend/     Spring Boot service, domain rules, persistence, build wrapper
    docs/        Capabilities, decisions, contracts, run/check instructions

These directories do not yet exist. This layout is a recommendation, not an
accepted architecture. Keep this system in one repo without a shared platform
across the three demos.

- Choose compatible supported releases from current official documentation;
  verify installed tools and record prerequisites/resolved versions. Use local
  project tooling; do not alter global installations as incidental setup.
- Split Angular presentation and API access into focused components/services.
  Keep substantial templates/styles separate; avoid a giant root component.
- Separate Java HTTP handling, catalog rules, and persistence responsibilities.
  Agree the data-access/schema approach; no ORM or migration tool is mandated.
- With only shared catalog fields, recommend one understandable entry model with
  a media-type field. Avoid an inheritance/plugin framework solely for future use.
- Document actual fields, validation, timestamps, search semantics, ordering,
  endpoint contracts, missing-record behaviour, and error payloads once agreed.
- If durable storage is accepted, ensure startup/schema initialization does not
  erase existing data. Treat reset as explicit and atomic, with known scope.
- Store synthetic fixtures in source control, runtime data separately and ignored.
  Include enough variety to demonstrate all types, duplicates if allowed, missing
  optional fields, filtering, and ordinary empty-result behaviour.
- Keep static content local. No metadata API, cover scraper, paid integration,
  media-processing dependency, queue, or distributed cache is needed by this proposal.

## Verification and delivery

Use [acceptance.md](acceptance.md). Prefer a main-flow browser walkthrough plus
focused checks of meaningful rules to redundant tests or broad test matrices.
Record actual commands, outcomes, and skipped/blocked checks. Do not invent
plausible run commands before implementing and verifying them.

Update README with exact setup/start/stop/reset instructions, prerequisites,
runtime data location, supported behaviour, and known limits. Summarize changes,
decisions made during work, checks performed, and anything requiring human review.
Leave a reviewable working tree; do not commit/push without authorization.
