'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as Icons from 'lucide-react'
import { Tag } from 'lucide-react'

interface Category {
  _id: string | { toString(): string }
  name: string
  icon: string
  order: number
  isVisible: boolean
}

interface CategoriesManagerProps {
  categories: Category[]
}

const ICON_OPTIONS = [
  'Tag', 'Candy', 'Cookie', 'ShoppingBag', 'Gift', 'Star', 'Heart',
  'Package', 'Cake', 'Coffee', 'IceCream', 'Pizza', 'Apple',
]

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('Tag')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openCreate = () => {
    setEditTarget(null)
    setName('')
    setIcon('Tag')
    setError('')
    setShowForm(true)
  }

  const openEdit = (cat: Category) => {
    setEditTarget(cat)
    setName(cat.name)
    setIcon(cat.icon)
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Nome obrigatório'); return }
    setLoading(true)
    setError('')
    try {
      const id = editTarget ? (typeof editTarget._id === 'string' ? editTarget._id : editTarget._id.toString()) : null
      const res = await fetch(id ? `/api/categories/${id}` : '/api/categories', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error?.message ?? 'Erro ao salvar')
        return
      }
      setShowForm(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta categoria?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const toggleVisibility = async (id: string, current: boolean) => {
    await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !current }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {editTarget ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Balas"
          />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ícone</p>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => {
                const IC = (Icons[ic as keyof typeof Icons] as React.ComponentType<{ className?: string }>) ?? Tag
                return (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${icon === ic ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600'}`}
                  >
                    <IC className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} loading={loading}>Salvar</Button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhuma categoria cadastrada</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {categories.map((cat) => {
              const id = typeof cat._id === 'string' ? cat._id : cat._id.toString()
              const IconComp = (Icons[cat.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>) ?? Tag
              return (
                <li key={id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                    <IconComp className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleVisibility(id, cat.isVisible)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      {cat.isVisible ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
