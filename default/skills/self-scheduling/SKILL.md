---
name: self-scheduling
description: >
  Track and self-schedule work for THIS workspace by writing one markdown file
  per issue under `.alice/issues/<id>.md` at the workspace root. Each file is
  YAML frontmatter + a markdown description. An issue WITHOUT a `when` field is
  just a tracked work item (it shows on the Issue board, the scanner ignores
  it). An issue WITH a `when` field self-schedules: the launcher scans the dir
  and, when it's due, spawns a fresh headless run of this workspace with your
  prompt; the run reports back to the user's Inbox. Use for: "track this",
  "add an issue/todo", "run this every 30 minutes", "every morning before the
  open do X", "check Y each hour and ping me only if Z", "do this once at 4pm",
  "self-schedule", "set up a recurring job". There is no command and no API —
  it is just editing these files.
---

# Issues & self-scheduling — `.alice/issues/<id>.md`

This workspace owns its work as **one markdown file per issue** in `.alice/issues/`
at its own root. Each file is YAML frontmatter (the structured fields) plus a
markdown body (the human description).

- An issue **without** `when` is a plain **tracked work item** — it appears on
  the Issue board for you and the user to see, but the scanner never fires it.
- An issue **with** `when` **self-schedules**: a launcher scanner reads the dir
  (it never interprets the work) and fires a **headless run** of this workspace
  when the issue is due — exactly like a recurring job.

The filename stem **is** the issue id (`morning-scan.md` → id `morning-scan`).

## Example — a scheduled issue (`.alice/issues/morning-scan.md`)

```markdown
---
title: Pre-market brief
status: todo
priority: high
assignee: ws:research
when: { kind: cron, cron: "30 8 * * 1-5" }
what: >
  Pull pre-market movers and overnight news for my watchlist, write a short
  brief to research/premarket.md, then run:
  alice-workspace inbox push --doc research/premarket.md --comments "Pre-market brief".
agent: claude
---

Every trading morning at 08:30, assemble the pre-market picture for the
watchlist so I have it before the open. Movers, gaps, and any overnight
headlines that move the thesis.
```

## Example — an unscheduled work item (`.alice/issues/refactor-fetcher.md`)

```markdown
---
title: Split the data fetcher into source + transform
status: backlog
priority: medium
assignee: unassigned
---

`src/fetch.ts` mixes the HTTP call with the normalization step, which makes the
retry logic hard to test. Pull the transform into its own pure function so it
can be unit-tested without the network. No rush — picking this up next time we
touch fetching.
```

The first self-schedules (it has `when`); the second is a pure work item the
scanner ignores. Drop the `when`/`what`/`agent` lines and any issue becomes a
plain tracked item; add a `when` and it starts firing.

## Frontmatter fields

- **`title`** — short, human-readable title of the issue (e.g. `Pre-market
  brief`). **Required.** This is what the Issue board and Inbox show. (The
  stable machine key is the filename `id`, not the title — so you can reword a
  title freely.)
- **`status`** *(optional, default `todo`)* — one of `backlog`, `todo`,
  `in_progress`, `done`, `canceled`. For a **scheduled** issue this is also its
  on/off switch: it fires only while the status is non-terminal. Moving it to
  `done` or `canceled` **silences** the schedule without deleting the file.
  (There is no `enabled` field — terminal status is how you pause a timer.)
- **`priority`** *(optional, default `none`)* — `urgent`, `high`, `medium`,
  `low`, `none`. Display/sort only.
- **`assignee`** *(optional, default `unassigned`)* — `human`, `ws:<workspace
  tag or id>`, or `unassigned`. Display only.
- **`when`** *(OPTIONAL — present iff the issue self-schedules)* — one of:
  - `{ kind: every, every: "30m" }` — repeat on an interval (`30m`, `2h`,
    `1h30m`). Runs on the next scan, then on the interval.
  - `{ kind: cron, cron: "0 9 * * 1-5" }` — a 5-field cron expression
    (`min hour day-of-month month day-of-week`; supports `*`, ranges `9-17`,
    lists `1,15`, steps `*/15`). Wall-clock; waits for the next match.
  - `{ kind: at, at: "2026-03-01T13:30:00Z" }` — run ONCE at an ISO timestamp,
    then never again.
- **`what`** *(optional)* — the prompt for the scheduled headless run (see
  below). If omitted, the fire prompt falls back to the title plus the markdown
  body. Only meaningful when `when` is present.
- **`agent`** *(optional)* — which CLI runs the scheduled job; defaults to this
  workspace's default agent. Only meaningful when `when` is present.

The markdown **body** below the closing `---` is the issue's description: free
prose for you and the user. For an unscheduled item it's the whole point; for a
scheduled item with no `what`, the body becomes part of the fire prompt.

## Write `what` for a headless run

The scheduled run is **headless — nobody is watching, and it cannot see this
conversation.** Write `what` (or, if you rely on the fallback, the body) as a
**complete, standalone instruction**, as if handing the job to a fresh teammate
who has only this workspace's files. Say exactly what to read, do, and produce.

**Decide what it outputs — and decide on purpose.** A headless run that does real
work and surfaces nothing has vanished. So:

- If the run produces something the user should see — a brief, a finding, a
  result — **push it to the Inbox**, the only channel a headless run has:
  `alice-workspace inbox push --comments "…"` (attach files with repeatable
  `--doc <path>`; run `alice-workspace --help` for the flags).
- If the run is a **check that didn't trigger** (condition not met, nothing
  changed), **exit silently — that is the correct outcome**, not a failure.
  Don't manufacture noise.

Put **conditions inside `what`**, not in the schedule — there is no condition
field. For "ping me only if X", write: "check X; if it holds, push an alert;
otherwise do nothing and exit."

> **Commit the file.** The scanner reads your working tree, so an uncommitted
> `.alice/issues/<id>.md` still takes effect — but commit it so the issue (and
> any schedule) travels with the workspace and survives. Treat it like any
> other source file.

> **Trades still need a human.** A scheduled run can research, prepare, and even
> *stage* trades — but staged trades execute only when you approve them in the
> Web UI (Trading-as-Git). A timer never moves money on its own.

## Notes

- The scanner ticks about once a minute; a sub-minute cadence runs at most once
  a minute. Only issues with a `when` are ever fired.
- The `id` (filename stem) keys the scanner's "last fired" memory for scheduled
  issues, so don't rename a scheduled file you mean to keep (a new filename
  looks like a brand-new issue and fires right away).
- Runs are one-shot and independent — a run can overlap another run or your own
  interactive session in this same checkout. Treat it like ordinary concurrent
  edits; don't assume exclusive access.
- Each file is parsed and re-validated on every scan; a malformed file is
  reported on the board, in isolation, without breaking the other issues.
- Remove an issue by deleting its `.alice/issues/<id>.md` file (and commit). To
  pause a schedule without deleting it, set `status: done` or `status: canceled`.
- **Legacy:** the old single `.alice/issue.json` is retired. If you find one,
  split each issue into its own `.alice/issues/<id>.md` file with the
  frontmatter above.
