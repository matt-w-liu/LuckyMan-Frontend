import type { ReactNode } from 'react'
import ProtectedRoute from '../ProtectedRoute'
import SideRail from './SideRail'
import TopBar from './TopBar'

interface AppShellProps {
  children: ReactNode
  /** `full` fills the viewport without page scroll (game table); `page` is a normal scrolling page. */
  variant?: 'page' | 'full'
}

export default function AppShell({ children, variant = 'page' }: AppShellProps) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col overflow-hidden bg-ink-900">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <SideRail />
          <main className={variant === 'full' ? 'min-w-0 flex-1 overflow-hidden' : 'min-w-0 flex-1 overflow-y-auto'}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
