# Optional later exercises

Ideas only: not assigned work, not baseline requirements, and not permission to
create issues automatically. First build and accept the agreed small baseline.

| Scenario | Example bounded requirement | Practice area |
| --- | --- | --- |
| Organize the library | Add tags and filter by multiple selected tags. | Java sets/maps, Angular selection state, data modelling. |
| Plan what to enjoy | Add a saved collection containing catalog entries in an explicit order. | Ordered collections, relationships, UI interaction. |
| Track progress | Add planned/in-progress/finished status with agreed type-specific meanings. | Domain modelling, forms, state transitions. |
| Summarize the catalog | Group entries by type or decade and show counts. | Java collection aggregation, Angular visualization. |
| Bring another catalog | Import a CSV with preview and a chosen duplicate policy. | Parsing, validation, collections, error reporting. |
| Edit from two tabs | Detect conflicting updates instead of silently losing an edit. | Optimistic concurrency, HTTP contracts, conflict UX. |
| Larger datasets | Design and optionally implement stable pagination and query behaviour. | System design, indexes, frontend state. |
| Background import | Process a larger import with progress and cancellation. | Bounded Java concurrency, partial results, task lifecycle. |

These exercises extend the catalog; they do not require adding actual media files.
If an exercise introduces uploads, playback, or external metadata services, define
that scope and its dependencies separately rather than treating it as implicit.

## Make one exercise concrete

Record starting baseline revision, user scenario, observable outcome, exclusions,
accepted choices, decisions to explore, expected artifacts/checks, and human
checkpoints. Choose who does the work: learner, agent, or collaboration. An agent
should not automatically implement an exercise intended for the learner.

For ExecDesk dogfooding, use the brief as a fictional issue and select the workflow
and work modes. The app needs no direct ExecDesk integration. Design exercises can
finish with a design/tradeoff artifact instead of code.

Use a separate copy or branch when useful. Exercise completion does not require a
commit or merge. Review and deliberately retain or discard the result; never
discard unrelated work automatically. Promote an exercise solution into the
baseline only by explicit decision. Record a stable baseline revision after
acceptance and authorized Git delivery.
