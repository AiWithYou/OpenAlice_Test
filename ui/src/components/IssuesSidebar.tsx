import { ListChecks } from 'lucide-react'

import { useWorkspace } from '../tabs/store'
import { getFocusedTab } from '../tabs/types'
import { SidebarRow } from './SidebarRow'

/**
 * Issues sidebar — Phase 1 is a single "All issues" view onto the global board.
 * Kept deliberately thin (mirrors the simplest sidebars, e.g. DevCategoryList);
 * saved filters / per-status views are Phase 2.
 */
export function IssuesSidebar() {
  const focused = useWorkspace((state) => getFocusedTab(state)?.spec)
  const openOrFocus = useWorkspace((state) => state.openOrFocus)
  const active = focused?.kind === 'issue'

  return (
    <div className="py-1">
      <SidebarRow
        label="All issues"
        active={active}
        icon={<ListChecks size={14} strokeWidth={1.75} className="text-text-muted/70" aria-hidden />}
        onClick={() => openOrFocus({ kind: 'issue', params: {} })}
      />
    </div>
  )
}
