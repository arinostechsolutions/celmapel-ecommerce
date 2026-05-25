'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { ALL_PERMISSIONS, PERM_LABELS, UNRESTRICTED_ROLES } from '@/lib/permissions'
import type { Permission } from '@/lib/permissions'

interface Collaborator {
  _id: string
  name: string
  email?: string
  role: string
  permissions: string[]
}

const ROLE_LABEL: Record<string, string> = {
  owner:   'Dono da loja',
  manager: 'Administrador',
  viewer:  'Colaborador',
}

export default function PermissoesPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState<string | null>(null)
  const [expanded, setExpanded]           = useState<string | null>(null)
  const [localPerms, setLocalPerms]       = useState<Record<string, string[]>>({})

  const fetchCollaborators = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/users?roles=owner,manager,viewer')
      const json = await res.json()
      const list: Collaborator[] = json.data?.users ?? []
      setCollaborators(list)
      const initial: Record<string, string[]> = {}
      list.forEach((c) => { initial[c._id] = c.permissions ?? [] })
      setLocalPerms(initial)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCollaborators() }, [fetchCollaborators])

  const toggle = (userId: string, perm: Permission) => {
    setLocalPerms((prev) => {
      const current = prev[userId] ?? []
      return {
        ...prev,
        [userId]: current.includes(perm)
          ? current.filter((p) => p !== perm)
          : [...current, perm],
      }
    })
  }

  const toggleAll = (userId: string) => {
    setLocalPerms((prev) => {
      const current = prev[userId] ?? []
      return {
        ...prev,
        [userId]: current.length === ALL_PERMISSIONS.length ? [] : [...ALL_PERMISSIONS],
      }
    })
  }

  const save = async (userId: string) => {
    setSaving(userId)
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: localPerms[userId] ?? [] }),
      })
      setCollaborators((prev) =>
        prev.map((c) => c._id === userId ? { ...c, permissions: localPerms[userId] ?? [] } : c)
      )
    } finally {
      setSaving(null)
    }
  }

  const hasChanges = (userId: string) => {
    const original = collaborators.find((c) => c._id === userId)?.permissions ?? []
    const current  = localPerms[userId] ?? []
    return JSON.stringify([...original].sort()) !== JSON.stringify([...current].sort())
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Permissões</h1>
          <p className="text-sm text-gray-500">Defina o acesso de cada colaborador às funcionalidades</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : collaborators.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-12 text-center text-sm text-gray-400">
          Nenhum colaborador cadastrado ainda. Promova um cliente na aba Clientes.
        </div>
      ) : (
        <div className="space-y-3">
          {collaborators.map((c) => {
            const isUnrestricted = UNRESTRICTED_ROLES.includes(c.role)
            const isOpen = expanded === c._id
            const perms  = localPerms[c._id] ?? []
            const allSelected = perms.length === ALL_PERMISSIONS.length

            return (
              <div key={c._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Header do colaborador */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : c._id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email} · {ROLE_LABEL[c.role] ?? c.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isUnrestricted ? (
                      <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-1 rounded-lg">
                        Acesso total
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {perms.length}/{ALL_PERMISSIONS.length} features
                      </span>
                    )}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Grid de permissões */}
                {isOpen && !isUnrestricted && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                    {/* Selecionar todos */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => toggleAll(c._id)}
                          className="w-4 h-4 rounded accent-purple-600"
                        />
                        <span className="text-sm font-medium text-gray-700">Selecionar todas</span>
                      </label>
                      {hasChanges(c._id) && (
                        <button
                          onClick={() => save(c._id)}
                          disabled={saving === c._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {saving === c._id ? 'Salvando...' : 'Salvar'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ALL_PERMISSIONS.map((perm) => (
                        <label
                          key={perm}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                            perms.includes(perm)
                              ? 'border-purple-300 bg-purple-50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={perms.includes(perm)}
                            onChange={() => toggle(c._id, perm)}
                            className="w-4 h-4 rounded accent-purple-600"
                          />
                          <span className="text-sm text-gray-700 font-medium">
                            {PERM_LABELS[perm]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
