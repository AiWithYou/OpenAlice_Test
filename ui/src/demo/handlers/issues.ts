import { http, HttpResponse } from 'msw'
import { demoIssuesSnapshot } from '../fixtures/issues'

// GET /api/issues returns the aggregated board SNAPSHOT (workspaces[].issues[]),
// produced server-side by scanning every workspace's `.alice/issues/<id>.md`
// dir — same shape family as /api/schedule, but the read-only board surface
// (no markdown body in the list; Phase 2 detail view loads it). The demo just
// passes the snapshot fixture through.
export const issuesHandlers = [
  http.get('/api/issues', () => HttpResponse.json(demoIssuesSnapshot)),
]
