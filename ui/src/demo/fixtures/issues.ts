import type { IssueSnapshot } from '../../api/issues'

// GET /api/issues aggregates every workspace's declared issues by SCANNING
// each workspace's `.alice/issues/<id>.md` dir (one markdown file per issue) —
// it is not a central store. The board list omits the markdown body (Phase 2
// detail view loads it). Scheduled issues (those carrying `when`) also surface
// on /api/schedule; the two demo fixtures intentionally share ids
// (morning-scan / thesis-watch / weekly-digest) so the surfaces stay coherent.
//
// Coverage exercised by these fixtures: 2 workspaces; all five `status` values
// (backlog/todo/in_progress/done/canceled); all five `priority` values
// (urgent/high/medium/low/none); all three assignee shapes (human / ws:<tag> /
// unassigned); all three `when` kinds (cron/every/at) plus unscheduled work
// items (no `when`, no lastFired/nextDue).

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const now = Date.now()

export const demoIssuesSnapshot: IssueSnapshot = {
  workspaces: [
    {
      wsId: 'demo-ws-auto-quant',
      tag: 'auto-quant',
      status: 'ok',
      issues: [
        // Scheduled (cron) + actively running.
        {
          id: 'morning-scan',
          title: 'Morning movers scan',
          status: 'in_progress',
          priority: 'high',
          assignee: 'ws:auto-quant',
          when: { kind: 'cron', cron: '30 8 * * 1-5' },
          lastFiredAtMs: now - HOUR,
          nextDueAtMs: now + 16 * HOUR,
        },
        // Scheduled (every) + urgent.
        {
          id: 'thesis-watch',
          title: 'Thesis invalidation watch',
          status: 'todo',
          priority: 'urgent',
          assignee: 'ws:auto-quant',
          when: { kind: 'every', every: '1h' },
          lastFiredAtMs: now - HOUR / 2,
          nextDueAtMs: now + HOUR / 2,
        },
        // Pure work item — no `when`, scanner ignores it, board still shows it.
        {
          id: 'rebalance-sizing-review',
          title: 'Rebalance sizing logic needs a human review',
          status: 'todo',
          priority: 'medium',
          assignee: 'human',
        },
        // Backlog, unassigned, unscheduled.
        {
          id: 'prune-stale-signals',
          title: 'Prune stale signal cache entries',
          status: 'backlog',
          priority: 'low',
          assignee: 'unassigned',
        },
      ],
    },
    {
      wsId: 'demo-ws-macro',
      tag: 'macro-research',
      status: 'ok',
      issues: [
        // Scheduled (cron) weekly digest.
        {
          id: 'weekly-digest',
          title: 'Weekly macro digest',
          status: 'in_progress',
          priority: 'medium',
          assignee: 'ws:macro-research',
          when: { kind: 'cron', cron: '0 16 * * 5' },
          lastFiredAtMs: now - 2 * DAY,
          nextDueAtMs: now + 5 * DAY,
        },
        // Scheduled (at) one-shot — never fired yet.
        {
          id: 'cpi-release-note',
          title: 'Write the CPI release reaction note',
          status: 'todo',
          priority: 'high',
          assignee: 'human',
          when: { kind: 'at', at: new Date(now + 3 * DAY).toISOString() },
          lastFiredAtMs: null,
          nextDueAtMs: now + 3 * DAY,
        },
        // Completed work item.
        {
          id: 'fed-speaker-calendar',
          title: 'Summarize the upcoming Fed speaker calendar',
          status: 'done',
          priority: 'none',
          assignee: 'human',
        },
        // Canceled work item.
        {
          id: 'cross-asset-correlation',
          title: 'Cross-asset correlation study',
          status: 'canceled',
          priority: 'low',
          assignee: 'unassigned',
        },
      ],
    },
  ],
}
