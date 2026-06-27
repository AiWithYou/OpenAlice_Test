import { fetchJson } from './client'
import type { ScheduleWhen } from './schedule'

/**
 * Issue board — the canonical client shape for GET /api/issues.
 *
 * Each workspace owns its issues as one markdown file per issue
 * (`.alice/issues/<id>.md`); the board scans every workspace (like
 * /api/schedule does for the scheduling projection) — there is NO central
 * store. An issue WITH a `when` is scheduled (the scanner fires it as a
 * headless run); an issue WITHOUT `when` is a pure tracked work item.
 *
 * Phase 1 is read-only and the list does NOT carry the markdown body — the
 * Phase 2 detail view loads that on demand.
 *
 * Demo handlers MUST import these types (do not inline an ad-hoc shape):
 * demo-shape drift has crashed the app before.
 */

export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled'
export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

export interface IssueListItem {
  id: string
  title: string
  status: IssueStatus
  priority: IssuePriority
  /** "human" | "ws:<tag|id>" | "unassigned" — free-form, rendered verbatim. */
  assignee: string
  /** Present iff the issue is scheduled (shares the core Schedule union). */
  when?: ScheduleWhen
  /** Scanner last-fired marker (epoch ms) — scheduled issues only. */
  lastFiredAtMs?: number | null
  /** Computed next fire (epoch ms) — scheduled issues only. */
  nextDueAtMs?: number | null
}

export interface IssueWorkspace {
  wsId: string
  tag: string
  /** 'invalid' = the `.alice/issues/` dir is present but unreadable/legacy. */
  status: 'ok' | 'invalid'
  error?: string
  issues: IssueListItem[]
}

export interface IssueSnapshot {
  workspaces: IssueWorkspace[]
}

export const issuesApi = {
  /** Read-only board: every workspace's issues, scanned across all workspaces. */
  async get(): Promise<IssueSnapshot> {
    return fetchJson<IssueSnapshot>('/api/issues')
  },
}
