/**
 * /api/issues — read-only Issue board, a Linear-style human+AI surface that
 * aggregates issues across ALL workspaces.
 *
 * Like /api/schedule, this is built by SCANNING each workspace's own
 * `.alice/issues/` directory (one markdown file per issue) — there is NO central
 * store. An issue is a tracked work item; if it additionally carries a `when` it
 * self-schedules, and the row then carries the scanner's firing markers. Creation
 * / edit is NOT a route — issues are a coding task (the agent writes the files).
 * This surface is purely "what issues exist across my workspaces".
 */
import { Hono } from 'hono'

import type { WorkspaceService } from '../../workspaces/service.js'

export function createIssuesRoutes(svc: WorkspaceService): Hono {
  const app = new Hono()

  // GET /api/issues → { workspaces: [{ wsId, tag, status, error?, issues: [...] }] }
  app.get('/', async (c) => {
    return c.json(await svc.issuesSnapshot())
  })

  return app
}
