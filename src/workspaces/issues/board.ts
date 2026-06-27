/**
 * Issue board snapshot — the read-only shape GET /api/issues returns, built by
 * SCANNING every workspace's `.alice/issues/` directory (never a central store).
 *
 * This is the board PROJECTION of the issue data model in `./declaration.ts`,
 * sibling to the scheduling projection in `../schedule/declaration.ts`. The board
 * shows ALL issues (scheduled or not); a scheduled issue additionally carries its
 * firing markers (`lastFiredAtMs` / `nextDueAtMs`) so the row matches real firing.
 *
 * Phase 1 is read-only and the list view does NOT include the markdown body — the
 * Phase 2 detail view loads it. Keeping the body out keeps the poll payload small.
 */

import type { Schedule } from '../../core/schedule-expr.js'
import type { IssuePriority, IssueRecord, IssueStatus } from './declaration.js'

/** One board row: the issue's display fields, plus — iff it self-schedules — its
 *  `when` and the scanner's firing markers. No markdown body (Phase 2 loads it). */
export interface IssuesSnapshotIssue {
  id: string
  title: string
  status: IssueStatus
  priority: IssuePriority
  assignee: string
  /** Present iff the issue self-schedules. */
  when?: Schedule
  /** When the scanner last fired this issue (epoch ms); only for scheduled issues. */
  lastFiredAtMs?: number | null
  /** When it is next due (epoch ms); only for scheduled issues. */
  nextDueAtMs?: number | null
}

export interface IssuesSnapshotWorkspace {
  wsId: string
  tag: string
  /** 'invalid' = the issues dir was unreadable (e.g. a retired `.alice/issue.json`).
   *  A workspace with no issues dir is 'ok' with an empty list — absence is not an
   *  error on the board (it simply contributes no rows). */
  status: 'ok' | 'invalid'
  error?: string
  issues: IssuesSnapshotIssue[]
}

export interface IssuesSnapshot {
  workspaces: IssuesSnapshotWorkspace[]
}

/** The firing markers a scheduled issue carries on the board. Computed by the
 *  caller (from the scanner's marker store + `snapshotScheduledIssue`) so the
 *  board's last/next match the schedule dashboard exactly. */
export interface IssueFiringMarkers {
  lastFiredAtMs: number | null
  nextDueAtMs: number | null
}

/** Map one validated issue (+ its firing markers, iff scheduled) to a board row.
 *  Pure: the caller resolves `markers` for scheduled issues and passes `null` for
 *  pure board work items. The markdown body is intentionally dropped. */
export function snapshotBoardIssue(
  issue: IssueRecord,
  markers: IssueFiringMarkers | null,
): IssuesSnapshotIssue {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    assignee: issue.assignee,
    ...(issue.when ? { when: issue.when } : {}),
    ...(markers ? { lastFiredAtMs: markers.lastFiredAtMs, nextDueAtMs: markers.nextDueAtMs } : {}),
  }
}
