'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const ALL_ROLE_OPTIONS = [
  { value: 'owner',    label: 'Dono da loja', color: 'text-purple-700' },
  { value: 'manager',  label: 'Administrador', color: 'text-blue-700' },
  { value: 'viewer',   label: 'Colaborador',   color: 'text-gray-700' },
  { value: 'customer', label: 'Cliente',       color: 'text-gray-400' },
]

const ALLOWED_BY_ROLE: Record<string, string[]> = {
  master: ['owner', 'manager', 'viewer', 'customer'],
  owner:  ['owner', 'viewer'],
}

interface PromoteUserButtonProps {
  userId: string
  currentRole: string
  myRole: string
}

export function PromoteUserButton({ userId, currentRole, myRole }: PromoteUserButtonProps) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)

  const allowed = ALLOWED_BY_ROLE[myRole] ?? []
  const options = ALL_ROLE_OPTIONS.filter((r) => allowed.includes(r.value))
  const current = ALL_ROLE_OPTIONS.find((r) => r.value === currentRole) ?? ALL_ROLE_OPTIONS[3]

  if (options.length === 0) return null

  const handleSelect = async (role: string) => {
    if (role === currentRole) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50',
          currentRole === 'customer'
            ? 'border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50'
            : 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100'
        )}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        {loading ? 'Salvando...' : current.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors',
                  opt.color,
                  opt.value === currentRole && 'bg-gray-50'
                )}
              >
                {opt.label}
                {opt.value === currentRole && <span className="ml-1 opacity-50">(atual)</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
