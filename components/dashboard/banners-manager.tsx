'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Eye, EyeOff, Link2, Tag, ExternalLink, Pencil, X, Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ImageUploader } from '@/components/ui/image-uploader'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Banner {
  _id: string | { toString(): string }
  title: string
  imageUrl: string
  imagePublicId?: string
  imageMobileUrl?: string
  imageMobilePublicId?: string
  linkUrl?: string
  isActive: boolean
  startDate: Date | string
  endDate: Date | string
  order: number
}

interface Category { _id: string; name: string }

interface BannersManagerProps {
  banners: Banner[]
  categories: Category[]
}

type LinkMode = 'none' | 'category' | 'custom'

const EMPTY_FORM = {
  title: '', imageUrl: '', imagePublicId: '',
  imageMobileUrl: '', imageMobilePublicId: '',
  linkUrl: '', startDate: '', endDate: '',
}

function resolveLinkMode(linkUrl?: string): LinkMode {
  if (!linkUrl) return 'none'
  if (linkUrl.startsWith('/busca?categoryId=')) return 'category'
  return 'custom'
}

function extractCategoryId(linkUrl?: string): string {
  if (!linkUrl) return ''
  const m = linkUrl.match(/categoryId=([^&]+)/)
  return m ? m[1] : ''
}

// ─── LinkSelector reutilizável ─────────────────────────────────────────────

function LinkSelector({
  linkMode, setLinkMode,
  selectedCategory, setSelectedCategory,
  customUrl, setCustomUrl,
  categories,
}: {
  linkMode: LinkMode
  setLinkMode: (m: LinkMode) => void
  selectedCategory: string
  setSelectedCategory: (s: string) => void
  customUrl: string
  setCustomUrl: (s: string) => void
  categories: Category[]
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Link ao clicar no banner</p>

      <div className="flex gap-2 flex-wrap">
        {([
          { id: 'none',     label: 'Nenhum',     icon: <span className="text-base leading-none">—</span> },
          { id: 'category', label: 'Categoria',  icon: <Tag className="w-3.5 h-3.5" /> },
          { id: 'custom',   label: 'URL própria', icon: <Link2 className="w-3.5 h-3.5" /> },
        ] as { id: LinkMode; label: string; icon: React.ReactNode }[]).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLinkMode(opt.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors',
              linkMode === opt.id
                ? 'bg-purple-600 text-white border-purple-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            {opt.icon}{opt.label}
          </button>
        ))}
      </div>

      {linkMode === 'category' && (
        <div className="space-y-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">Selecione uma categoria...</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          {selectedCategory && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              <ExternalLink className="w-3 h-3 text-purple-500 shrink-0" />
              <span className="font-mono break-all">/busca?categoryId={selectedCategory}</span>
            </div>
          )}
        </div>
      )}

      {linkMode === 'custom' && (
        <Input
          placeholder="https://..."
          type="url"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
        />
      )}
    </div>
  )
}

// ─── BannersManager ────────────────────────────────────────────────────────

export function BannersManager({ banners, categories }: BannersManagerProps) {
  const router = useRouter()

  // ── Criar
  const [showCreate, setShowCreate] = useState(false)
  const [creating,   setCreating]   = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_FORM)
  const [createLinkMode,        setCreateLinkMode]        = useState<LinkMode>('none')
  const [createSelectedCategory, setCreateSelectedCategory] = useState('')
  const [createCustomUrl,        setCreateCustomUrl]        = useState('')

  // ── Editar
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [saving,    setSaving]      = useState(false)
  const [editForm,  setEditForm]    = useState(EMPTY_FORM)
  const [editLinkMode,        setEditLinkMode]        = useState<LinkMode>('none')
  const [editSelectedCategory, setEditSelectedCategory] = useState('')
  const [editCustomUrl,        setEditCustomUrl]        = useState('')

  const resolveLink = (mode: LinkMode, cat: string, custom: string) => {
    if (mode === 'category' && cat) return `/busca?categoryId=${cat}`
    if (mode === 'custom') return custom
    return ''
  }

  // ── Abrir edição
  const startEdit = (banner: Banner) => {
    const id  = typeof banner._id === 'string' ? banner._id : banner._id.toString()
    const mode = resolveLinkMode(banner.linkUrl)
    setEditingId(id)
    setEditForm({
      title:                banner.title,
      imageUrl:             banner.imageUrl,
      imagePublicId:        banner.imagePublicId ?? '',
      imageMobileUrl:       banner.imageMobileUrl ?? '',
      imageMobilePublicId:  banner.imageMobilePublicId ?? '',
      linkUrl:              banner.linkUrl ?? '',
      startDate:            banner.startDate ? String(banner.startDate).slice(0, 10) : '',
      endDate:              banner.endDate   ? String(banner.endDate).slice(0, 10)   : '',
    })
    setEditLinkMode(mode)
    setEditSelectedCategory(extractCategoryId(banner.linkUrl))
    setEditCustomUrl(mode === 'custom' ? (banner.linkUrl ?? '') : '')
  }

  const cancelEdit = () => { setEditingId(null) }

  // ── Salvar edição
  const handleSave = async (id: string) => {
    setSaving(true)
    try {
      await fetch(`/api/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          linkUrl: resolveLink(editLinkMode, editSelectedCategory, editCustomUrl),
        }),
      })
      setEditingId(null)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  // ── Criar banner
  const handleCreate = async () => {
    if (!createForm.title || !createForm.imageUrl || !createForm.startDate || !createForm.endDate) return
    setCreating(true)
    try {
      await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          linkUrl: resolveLink(createLinkMode, createSelectedCategory, createCustomUrl),
        }),
      })
      setShowCreate(false)
      setCreateForm(EMPTY_FORM)
      setCreateLinkMode('none')
      setCreateSelectedCategory('')
      setCreateCustomUrl('')
      router.refresh()
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (id: string, current: boolean) => {
    await fetch(`/api/banners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este banner?')) return
    await fetch(`/api/banners/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Banner
        </Button>
      </div>

      {/* ── Formulário de criação ── */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h3 className="font-semibold text-gray-900">Novo Banner</h3>

          <Input label="Título do banner" placeholder="Ex: Promoção de Páscoa — até 40% off"
            value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))} />

          {/* Aviso de dimensões */}
          <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <div className="space-y-0.5">
              <p className="font-semibold">Use imagens diferentes para cada tela</p>
              <p>
                <span className="font-medium">Desktop:</span> proporção 3:1 — recomendado <strong>1200 × 400 px</strong> (paisagem). Exibida em computadores e tablets.
              </p>
              <p>
                <span className="font-medium">Mobile:</span> proporção 1:1 — recomendado <strong>600 × 600 px</strong> (quadrado). Exibida em smartphones.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageUploader context="banner" value={createForm.imageUrl || undefined}
              onChange={({ url, publicId }) => setCreateForm((f) => ({ ...f, imageUrl: url, imagePublicId: publicId }))}
              onRemove={() => setCreateForm((f) => ({ ...f, imageUrl: '', imagePublicId: '' }))} />

            <ImageUploader context="banner_mobile" value={createForm.imageMobileUrl || undefined}
              onChange={({ url, publicId }) => setCreateForm((f) => ({ ...f, imageMobileUrl: url, imageMobilePublicId: publicId }))}
              onRemove={() => setCreateForm((f) => ({ ...f, imageMobileUrl: '', imageMobilePublicId: '' }))} />
          </div>

          <LinkSelector
            linkMode={createLinkMode}   setLinkMode={setCreateLinkMode}
            selectedCategory={createSelectedCategory} setSelectedCategory={setCreateSelectedCategory}
            customUrl={createCustomUrl} setCustomUrl={setCreateCustomUrl}
            categories={categories}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Data início" type="date" value={createForm.startDate}
              onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))} />
            <Input label="Data fim" type="date" value={createForm.endDate}
              onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} loading={creating}
              disabled={!createForm.title || !createForm.imageUrl || !createForm.startDate || !createForm.endDate ||
                (createLinkMode === 'category' && !createSelectedCategory)}>
              Criar Banner
            </Button>
          </div>
        </div>
      )}

      {/* ── Lista de banners ── */}
      <div className="grid gap-4">
        {banners.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Nenhum banner cadastrado
          </div>
        )}

        {banners.map((banner) => {
          const id = typeof banner._id === 'string' ? banner._id : banner._id.toString()
          const isEditing = editingId === id

          return (
            <div key={id} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
              {/* Preview do banner */}
              <div className="flex gap-4 p-4">
                <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{banner.title}</h3>
                    <Badge variant={banner.isActive ? 'success' : 'default'}>
                      {banner.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">
                    {formatDate(banner.startDate)} — {formatDate(banner.endDate)}
                  </p>
                  {banner.linkUrl && (
                    <p className="text-xs text-purple-600 font-mono truncate flex items-center gap-1">
                      <Link2 className="w-3 h-3 shrink-0" />{banner.linkUrl}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => isEditing ? cancelEdit() : startEdit(banner)}
                    className={cn('p-2 rounded-xl transition-colors',
                      isEditing ? 'bg-purple-50 text-purple-600' : 'text-gray-400 hover:bg-gray-100')}
                    title={isEditing ? 'Fechar edição' : 'Editar'}>
                    {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleToggle(id, banner.isActive)}
                    className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
                    title={banner.isActive ? 'Desativar' : 'Ativar'}>
                    {banner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remover">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Formulário de edição inline (expand) */}
              {isEditing && (
                <div className="border-t border-gray-100 p-5 space-y-5 bg-gray-50/50">
                  <p className="text-sm font-semibold text-gray-700">Editar Banner</p>

                  <Input label="Título" value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />

                  {/* Aviso de dimensões */}
                  <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                    <div className="space-y-0.5">
                      <p className="font-semibold">Use imagens diferentes para cada tela</p>
                      <p><span className="font-medium">Desktop:</span> <strong>1200 × 400 px</strong> (proporção 3:1 — paisagem)</p>
                      <p><span className="font-medium">Mobile:</span> <strong>600 × 600 px</strong> (proporção 1:1 — quadrado)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ImageUploader context="banner" value={editForm.imageUrl || undefined}
                      onChange={({ url, publicId }) => setEditForm((f) => ({ ...f, imageUrl: url, imagePublicId: publicId }))}
                      onRemove={() => setEditForm((f) => ({ ...f, imageUrl: '', imagePublicId: '' }))} />

                    <ImageUploader context="banner_mobile" value={editForm.imageMobileUrl || undefined}
                      onChange={({ url, publicId }) => setEditForm((f) => ({ ...f, imageMobileUrl: url, imageMobilePublicId: publicId }))}
                      onRemove={() => setEditForm((f) => ({ ...f, imageMobileUrl: '', imageMobilePublicId: '' }))} />
                  </div>

                  <LinkSelector
                    linkMode={editLinkMode}       setLinkMode={setEditLinkMode}
                    selectedCategory={editSelectedCategory} setSelectedCategory={setEditSelectedCategory}
                    customUrl={editCustomUrl}     setCustomUrl={setEditCustomUrl}
                    categories={categories}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Data início" type="date" value={editForm.startDate}
                      onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))} />
                    <Input label="Data fim" type="date" value={editForm.endDate}
                      onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))} />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={cancelEdit}>Cancelar</Button>
                    <Button size="sm" loading={saving} onClick={() => handleSave(id)} className="gap-1.5">
                      <Check className="w-4 h-4" />
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
