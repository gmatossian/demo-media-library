# Media library — product brief

## Agreed purpose

Build a familiar system with basic working features first. Later, learners or
agents can tackle new requirements, bugs, investigations, and design questions
against that baseline. Initial construction is not itself the learning curriculum.

Practice may be human-led, collaborative, or delegated. ExecDesk dogfooding uses
believable fictional issues to exercise task workflows. The app does not need a
direct ExecDesk integration.

Exercises need not produce a commit or alter the baseline. Keep a useful starting
point rather than gradually incorporating every successful exercise solution.

## Product interpretation

Accepted by Gabriel on 2026-09-25 (S1 in [decisions.md](decisions.md)).

A personal-style catalog of books, films, and music albums: people browse what is
in the library, find a title, inspect its details, and maintain its catalog entry.

The catalog stores descriptive metadata only. Adding an entry does
not upload a book/video/audio file or acquire access to copyrighted content.
There is no streaming, playback, lending, or inventory of physical copies.

This interpretation offers understandable tasks across Angular forms/state,
Java collections/filtering, data modelling, and later system-design exercises
without needing an initial media-processing infrastructure.

An uploaded-file library would be a separate scope and architecture decision,
not a quiet extension of this catalog.

## Quality and audience

For Gabriel, other learners, and people evaluating development agents. Make the
purpose intuitive, supported capabilities explicit, and limits honest. Use original
fictional titles/creators and demo-only labelling in both app and documentation.

Keep frontend/backend together in this system's own repository. Prefer a simple
local setup, repeatable fixtures, focused files, clear errors, and proportionate
verification. Avoid production-hardening ceremony and speculative abstractions.

The repository is private at handoff. Potential future public use does not authorize
publication. Latest explicit user instructions govern; record meaningful changes
to direction and distinguish recommendations from accepted decisions.
