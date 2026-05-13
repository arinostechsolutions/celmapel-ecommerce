'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardSidebar } from './sidebar'
import { DashboardTopbar }  from './topbar'

// Rotas que não devem exibir a shell do dashboard (sem sidebar/topbar)
const AUTH_ROUTES = ['/dashboard/login']

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (AUTH_ROUTES.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 ml-0 lg:ml-[var(--sidebar-width)]">
        <DashboardTopbar onMenuToggle={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
