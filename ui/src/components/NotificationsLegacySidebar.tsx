import { Bell } from 'lucide-react'
import { useWorkspace } from '../tabs/store'
import { getFocusedTab } from '../tabs/types'
import { useUnreadNotificationsCount } from '../live/notifications-read'
import { SidebarRow } from './SidebarRow'

/**
 * Legacy NotificationsStore sidebar.
 *
 * The pre-Workspace push surface — populated by heartbeat / cron / the
 * `/api/dev/send` manual channel via `connectorCenter.notify`. Lives in
 * the ActivityBar's Legacy section because the current push channel for
 * workspace agents is Inbox, not Notifications.
 *
 * Sidebar just opens the existing NotificationsInboxPage tab; no
 * secondary structure (filter dropdown lives inside the page itself).
 */
export function NotificationsLegacySidebar() {
  const focused = useWorkspace((state) => getFocusedTab(state)?.spec)
  const isActive = focused?.kind === 'notifications-inbox'
  const openOrFocus = useWorkspace((state) => state.openOrFocus)
  const unreadCount = useUnreadNotificationsCount()

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-[11px] text-text-muted/70 leading-relaxed border-b border-border/40">
        Legacy push surface — fed by heartbeat / cron AgentCenter pings.
        Workspace agents push to the new Inbox tab now.
      </div>
      <div className="py-0.5">
        <SidebarRow
          label={
            <span className="flex items-center gap-2">
              <Bell size={14} strokeWidth={1.8} className="shrink-0" />
              <span>Notifications</span>
            </span>
          }
          active={isActive}
          onClick={() => openOrFocus({ kind: 'notifications-inbox', params: {} })}
          trail={
            unreadCount > 0 ? (
              <span
                className="min-w-[16px] h-[16px] px-1 rounded-full bg-red text-[10px] font-semibold text-white tabular-nums flex items-center justify-center"
                aria-label={`${unreadCount} unread`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : undefined
          }
        />
      </div>
    </div>
  )
}
