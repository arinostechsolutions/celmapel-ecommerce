'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Copy, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const Schema = z.object({
  name:        z.string().min(1, 'Nome obrigatório').max(200),
  description: z.string().max(500).optional(),
  utmSource:   z.string().min(1, 'Obrigatório').max(100),
  utmMedium:   z.string().min(1, 'Obrigatório').max(100),
  utmCampaign: z.string().min(1, 'Obrigatório').max(100),
  utmContent:  z.string().max(100).optional(),
  utmTerm:     z.string().max(100).optional(),
  startDate:   z.string().min(1, 'Data obrigatória'),
  endDate:     z.string().min(1, 'Data obrigatória'),
  isActive:    z.boolean().default(true),
})

type FormData = z.input<typeof Schema>

const APP_URL = typeof window !== 'undefined' ? window.location.origin : ''

function buildUtmUrl(base: string, params: Record<string, string>) {
  const url = new URL(base)
  Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v) })
  return url.toString()
}

// Sugestões pré-definidas para UTM
const UTM_SOURCE_SUGGESTIONS  = ['instagram', 'facebook', 'whatsapp', 'google', 'email', 'tiktok', 'influencer']
const UTM_MEDIUM_SUGGESTIONS  = ['social', 'cpc', 'email', 'post', 'stories', 'reels', 'organic']

export default function NewCampaignPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      isActive: true,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    },
  })

  const values = watch()
  const utmUrl = (values.utmSource && values.utmMedium && values.utmCampaign)
    ? buildUtmUrl(APP_URL || 'https://sualoja.com', {
        utm_source:   values.utmSource,
        utm_medium:   values.utmMedium,
        utm_campaign: values.utmCampaign,
        utm_content:  values.utmContent ?? '',
        utm_term:     values.utmTerm ?? '',
      })
    : ''

  const copyUrl = () => {
    if (!utmUrl) return
    navigator.clipboard.writeText(utmUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setServerError(json.error?.message ?? 'Erro ao criar campanha'); return }
    router.push('/dashboard/campanhas')
    router.refresh()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/campanhas" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nova Campanha</h1>
          <p className="text-sm text-gray-500">Crie um link rastreável com parâmetros UTM</p>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Dados básicos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informações da Campanha</h2>

          <Input label="Nome da campanha" placeholder="Ex: Black Friday Instagram" error={errors.name?.message} {...register('name')} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descrição (opcional)</label>
            <textarea
              rows={2}
              placeholder="Descreva o objetivo da campanha..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-100 focus:border-purple-500"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de início" type="date" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="Data de fim"    type="date" error={errors.endDate?.message}   {...register('endDate')} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded text-purple-600" {...register('isActive')} />
            <span className="text-sm font-medium text-gray-700">Campanha ativa</span>
          </label>
        </div>

        {/* Parâmetros UTM */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Parâmetros UTM</h2>
            <p className="text-xs text-gray-400 mt-0.5">Usados para rastrear de onde vêm os visitantes que acessarem o link</p>
          </div>

          {/* utm_source */}
          <div className="space-y-1">
            <Input label="utm_source — origem do tráfego" placeholder="instagram" error={errors.utmSource?.message} {...register('utmSource')} />
            <div className="flex flex-wrap gap-1">
              {UTM_SOURCE_SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setValue('utmSource', s)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* utm_medium */}
          <div className="space-y-1">
            <Input label="utm_medium — tipo de mídia" placeholder="social" error={errors.utmMedium?.message} {...register('utmMedium')} />
            <div className="flex flex-wrap gap-1">
              {UTM_MEDIUM_SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setValue('utmMedium', s)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Input label="utm_campaign — nome da campanha" placeholder="black-friday-2026" error={errors.utmCampaign?.message} {...register('utmCampaign')} />
          <Input label="utm_content — conteúdo (opcional)" placeholder="banner-principal" {...register('utmContent')} />
          <Input label="utm_term — termo (opcional)" placeholder="doces-festa" {...register('utmTerm')} />
        </div>

        {/* Preview do link gerado */}
        {utmUrl && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-indigo-700">Link rastreável gerado</p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={copyUrl}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <a href={utmUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  Testar
                </a>
              </div>
            </div>
            <code className="block text-xs text-indigo-800 break-all leading-relaxed bg-white/60 rounded-lg px-3 py-2">
              {utmUrl}
            </code>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting} className="gap-2">
            <Save className="w-4 h-4" />
            Criar campanha
          </Button>
          <Link href="/dashboard/campanhas">
            <Button type="button" variant="ghost">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
