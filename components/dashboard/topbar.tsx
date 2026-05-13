'use client'

import { usePathname } from 'next/navigation'
import { LogOut, Menu, Bell } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Visão Geral',
  '/dashboard/produtos': 'Produtos',
  '/dashboard/categorias': 'Categorias',
  '/dashboard/banners': 'Banners',
  '/dashboard/campanhas': 'Campanhas',
  '/dashboard/clientes': 'Clientes',
  '/dashboard/configuracoes': 'Configurações',
}

interface DashboardTopbarProps {
  onMenuToggle: () => void
}

export function DashboardTopbar({ onMenuToggle }: DashboardTopbarProps) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const title = Object.entries(PAGE_TITLES)
    .reverse()
    .find(([key]) => pathname.startsWith(key))?.[1] ?? 'Dashboard'

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/dashboard/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
