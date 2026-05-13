'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Tag,
  Image,
  Megaphone,
  Users,
  Settings,
  ChevronRight,
  Store,
  X,
  FileBarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/produtos', label: 'Produtos', icon: Package },
  { href: '/dashboard/categorias', label: 'Categorias', icon: Tag },
  { href: '/dashboard/banners', label: 'Banners', icon: Image },
  { href: '/dashboard/campanhas', label: 'Campanhas', icon: Megaphone },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/relatorio', label: 'Relatório', icon: FileBarChart2 },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
]

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}) {
  const pathname = usePathname() ?? ''
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group',
        isActive
          ? 'bg-purple-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600')} />
      {label}
      {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
    </Link>
  )
}

interface DashboardSidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function DashboardSidebar({ mobileOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()

  // Fecha o menu ao navegar
  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ width: 'var(--sidebar-width)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-2 px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Celmapel</p>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-purple-600 transition-colors"
          >
            <Store className="w-4 h-4" />
            Ver loja
          </Link>
        </div>
      </aside>
    </>
  )
}
