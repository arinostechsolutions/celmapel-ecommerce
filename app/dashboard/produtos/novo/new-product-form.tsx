'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUploader } from '@/components/ui/image-uploader'
import { cn } from '@/lib/utils'

interface Category { _id: string; name: string }

// Converte string formatada (ex: "29,90" ou "29.90") em número float
function parseBRLInput(v: string): number {
  // Remove tudo exceto dígitos e separadores
  const clean = v.replace(/[^\d,\.]/g, '')
  // Se tem vírgula, assume formato BR: troca vírgula por ponto
  const normalized = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean
  return parseFloat(normalized) || 0
}

// Formata enquanto digita: apenas dígitos e no máximo um separador decimal
function maskBRLInput(raw: string): string {
  // Remove tudo que não é dígito, vírgula ou ponto
  let v = raw.replace(/[^\d,\.]/g, '')
  // Permite apenas um separador decimal (último digitado vence)
  const commaIdx = v.lastIndexOf(',')
  const dotIdx   = v.lastIndexOf('.')
  const sepIdx   = Math.max(commaIdx, dotIdx)
  if (sepIdx !== -1) {
    const intPart = v.slice(0, sepIdx).replace(/[,\.]/g, '')
    const decPart = v.slice(sepIdx + 1).replace(/[,\.]/g, '').slice(0, 2)
    v = decPart.length > 0 ? `${intPart},${decPart}` : `${intPart},`
  }
  return v
}

const Schema = z.object({
  name:        z.string().min(1, 'Nome obrigatório').max(200).trim(),
  description: z.string().max(5000).optional(),
  price:       z.number({ error: "Preço inválido" }).positive('Preço deve ser maior que zero'),
  promoPrice:  z.number().positive('Deve ser maior que zero').optional(),
  sku:         z.string().max(100).optional(),
  categoryId:  z.string().min(1, 'Categoria obrigatória'),
  status:      z.enum(['published', 'draft', 'inactive']),
  showOnSite:  z.boolean(),
  isFeatured:  z.boolean(),
})

type FormData = z.infer<typeof Schema>

// ─── PriceInput ──────────────────────────────────────────────────────────────

function PriceInput({
  label, value, onChange, error, placeholder,
}: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  error?: string
  placeholder?: string
}) {
  const [display, setDisplay] = useState(
    value != null && value > 0 ? String(value).replace('.', ',') : ''
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskBRLInput(e.target.value)
    setDisplay(masked)
    const num = parseBRLInput(masked)
    onChange(num > 0 ? num : undefined)
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">R$</span>
        <input
          type="text"
          inputMode="decimal"
          value={display}
          onChange={handleChange}
          placeholder={placeholder ?? '0,00'}
          className={cn(
            'w-full h-10 pl-9 pr-3 rounded-xl border text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-100 focus:border-purple-500',
            error ? 'border-red-400' : 'border-gray-200'
          )}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  published: 'Publicado',
  draft:     'Rascunho',
  inactive:  'Inativo',
}

export function NewProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [imageUrl,    setImageUrl]    = useState('')
  const [imagePublicId, setImagePublicId] = useState('')

  const {
    register, handleSubmit, watch, control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      status: 'draft',
      showOnSite: false,
      isFeatured: false,
    },
  })

  const status    = watch('status')
  const showOnSite = watch('showOnSite')

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const body = {
      ...data,
      images: imageUrl ? [{ url: imageUrl, publicId: imagePublicId, isPrimary: true }] : [],
      tags: [],
      variations: [],
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()

    if (!res.ok) {
      const fieldErrors = json.error?.details
      if (fieldErrors) {
        const msgs = Object.values(fieldErrors).flat().join(', ')
        setServerError(msgs)
      } else {
        setServerError(json.error?.message ?? 'Erro ao criar produto')
      }
      return
    }

    router.push('/dashboard/produtos')
    router.refresh()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/produtos" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Novo Produto</h1>
          <p className="text-sm text-gray-500">Adicione um produto ao catálogo da loja</p>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Dados principais */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Dados do Produto</h2>

          <Input
            label="Nome do produto"
            placeholder="Ex: Bala de Coco 500g"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descrição (opcional)</label>
            <textarea
              rows={4}
              placeholder="Descreva o produto, ingredientes, modo de uso..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-100 focus:border-purple-500 resize-none"
              {...register('description')}
            />
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Categoria <span className="text-red-500">*</span></label>
            <select
              className={cn(
                'h-10 w-full rounded-xl border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-100 focus:border-purple-500',
                errors.categoryId ? 'border-red-400' : 'border-gray-200'
              )}
              {...register('categoryId')}
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId.message}</p>}
            {categories.length === 0 && (
              <p className="text-xs text-amber-600">
                Nenhuma categoria cadastrada.{' '}
                <Link href="/dashboard/categorias" className="underline">Criar categoria</Link>
              </p>
            )}
          </div>

          <Input
            label="SKU / Código interno (opcional)"
            placeholder="Ex: BAL-001"
            {...register('sku')}
          />
        </div>

        {/* Preços */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Preços</h2>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <PriceInput
                  label="Preço *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.price?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="promoPrice"
              render={({ field }) => (
                <PriceInput
                  label="Preço promocional"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.promoPrice?.message}
                  placeholder="0,00 (opcional)"
                />
              )}
            />
          </div>
          <p className="text-xs text-gray-400">Use vírgula como separador decimal. Ex: 29,90</p>
        </div>

        {/* Imagem do Produto */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Imagem do Produto</h2>
          <ImageUploader
            context="product"
            value={imageUrl || undefined}
            onChange={({ url, publicId }) => { setImageUrl(url); setImagePublicId(publicId) }}
            onRemove={() => { setImageUrl(''); setImagePublicId('') }}
          />
        </div>

        {/* Publicação */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Publicação</h2>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <div className="flex gap-2">
              {(['published', 'draft', 'inactive'] as const).map((s) => (
                <label key={s} className={cn(
                  'flex-1 flex items-center justify-center py-2 rounded-xl border text-sm font-medium cursor-pointer transition-colors',
                  status === s
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'border-gray-200 text-gray-600 hover:border-purple-300'
                )}>
                  <input type="radio" value={s} className="sr-only" {...register('status')} />
                  {STATUS_LABELS[s]}
                </label>
              ))}
            </div>
          </div>

          {/* Visibilidade */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              {showOnSite ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              <div>
                <p className="text-sm font-medium text-gray-700">Visível na loja</p>
                <p className="text-xs text-gray-400">Exibir este produto para os clientes</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" {...register('showOnSite')} />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-purple-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded text-purple-600" {...register('isFeatured')} />
            <span className="text-sm font-medium text-gray-700">Produto em destaque</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting} className="gap-2">
            <Save className="w-4 h-4" />
            Criar produto
          </Button>
          <Link href="/dashboard/produtos">
            <Button type="button" variant="ghost">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
