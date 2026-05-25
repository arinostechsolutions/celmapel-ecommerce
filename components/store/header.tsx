'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ShoppingCart, X, User, LogOut, UserCircle2 } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useCart, useCartTotals } from '@/hooks/use-cart'
import { MiniCart } from './mini-cart'
import { cn } from '@/lib/utils'

interface HeaderProps {
  storeName: string
  storeLogo?: string
}

interface AuthUser {
  name: string
  cpf?: string
}

// ─── UserMenu ─────────────────────────────────────────────────────────────────

function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      let res = await fetch('/api/auth/me')

      // access_token expirado → tenta refresh silencioso
      if (res.status === 401) {
        const refresh = await fetch('/api/auth/refresh', { method: 'POST' })
        if (refresh.ok) res = await fetch('/api/auth/me')
      }

      if (res.ok) {
        const json = await res.json()
        if (json?.data) setUser({ name: json.data.name, cpf: json.data.cpf })
      }
    }
    load().catch(() => {})
  }, [])

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Entrar"
      >
        <User className="w-5 h-5" />
      </Link>
    )
  }

  const firstName = user.name.split(' ')[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-colors text-sm font-medium',
          open ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
        )}
        aria-label="Menu do usuário"
        aria-expanded={open}
      >
        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
          {firstName[0].toUpperCase()}
        </div>
        <span className="hidden sm:block max-w-[80px] truncate">{firstName}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs text-gray-400">Logado como</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
          </div>
          <div className="py-1">
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserCircle2 className="w-4 h-4 text-gray-400" />
              Meu perfil
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── StoreHeader ──────────────────────────────────────────────────────────────

export function StoreHeader({ storeName, storeLogo }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { isMiniCartOpen, openMiniCart, closeMiniCart } = useCart()
  const { itemCount } = useCartTotals()

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Sincroniza o campo com o parâmetro da URL ao entrar na página de busca
  useEffect(() => {
    if (pathname?.startsWith('/busca')) {
      const q = new URLSearchParams(window.location.search).get('q') ?? ''
      setSearchQuery(q)
    }
  }, [pathname])

  // Debounce: navega automaticamente 500ms após o usuário parar de digitar
  useEffect(() => {
    const trimmed = searchQuery.trim()
    // Só aciona o debounce se estiver digitando ou se já estiver na página de busca (para limpar)
    if (!trimmed && !pathname?.startsWith('/busca')) return
    const timer = setTimeout(() => {
      const navigate = pathname?.startsWith('/busca') ? router.replace : router.push
      navigate(trimmed ? `/busca?q=${encodeURIComponent(trimmed)}` : '/busca')
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  const toggleMiniCart = () => isMiniCartOpen ? closeMiniCart() : openMiniCart()

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200',
        isScrolled ? 'shadow-md' : 'shadow-sm'
      )}
      style={{ height: 'var(--header-height)' }}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {storeLogo ? (
            <Image
              src={storeLogo}
              alt={storeName}
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="text-lg font-bold text-purple-700 tracking-tight">{storeName}</span>
          )}
        </Link>

        {/* Search — desktop */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:bg-white transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 ml-auto">
          {/* Search toggle — mobile */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Buscar"
          >
            {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Account */}
          <UserMenu />

          {/* Cart — âncora do mini-cart dropdown */}
          <div className="relative">
            <button
              onClick={toggleMiniCart}
              className={cn(
                'relative p-2 rounded-xl transition-colors',
                isMiniCartOpen
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
              aria-label={`Carrinho — ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
              aria-expanded={isMiniCartOpen}
            >
              <ShoppingCart className="w-5 h-5" />

              {/* Badge com contagem */}
              {itemCount > 0 && (
                <span
                  key={itemCount}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-purple-600 text-white text-[10px] font-bold animate-bounce-once"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Mini-cart dropdown */}
            <MiniCart />
          </div>
        </div>
      </div>

      {/* Mobile search expansion */}
      {isSearchOpen && (
        <div className="md:hidden px-4 pb-3 bg-white border-t border-gray-100">
          <form onSubmit={handleSearch}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos..."
                autoFocus
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:bg-white transition-all"
              />
            </div>
          </form>
        </div>
      )}
    </header>
  )
}
