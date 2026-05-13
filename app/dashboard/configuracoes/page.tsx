'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, RefreshCw, Pipette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SettingsSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(200),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor HEX inválida'),
  whatsappPhone: z.string().min(8, 'Telefone inválido').max(15),
  whatsappDDI: z.string().max(4),
  whatsappTemplate: z.string().max(1000),
  address: z.string().max(300).optional(),
})

type SettingsForm = z.infer<typeof SettingsSchema>

// Paleta de cores sugeridas
const PALETTE = [
  '#9333ea', '#7c3aed', '#2563eb', '#0891b2',
  '#059669', '#d97706', '#dc2626', '#db2777',
  '#0f172a', '#475569',
]

export default function SettingsPage() {
  const [saving, setSaving]   = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')
  const [colorPreview, setColorPreview] = useState('#9333ea')

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      primaryColor: '#9333ea',
      whatsappDDI: '55',
      whatsappTemplate: 'Olá! Gostaria de fazer o seguinte pedido:\n\n{itens}\n\n{cupom}*Total: {total}*',
    },
  })

  const primaryColor = watch('primaryColor')

  useEffect(() => {
    if (/^#[0-9a-fA-F]{6}$/.test(primaryColor)) setColorPreview(primaryColor)
  }, [primaryColor])

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          reset(json.data)
          if (json.data.primaryColor) setColorPreview(json.data.primaryColor)
        }
      })
      .catch(() => {})
  }, [reset])

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) setMessage('Configurações salvas com sucesso!')
      else setMessage('Erro ao salvar configurações')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/sync/inventory', { method: 'POST' })
      if (res.ok) setMessage('Sincronização iniciada!')
      else setMessage('Erro ao iniciar sincronização')
    } finally {
      setSyncing(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure os dados do seu estabelecimento</p>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          message.includes('sucesso') || message.includes('iniciada')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Dados da Loja</h2>

        <Input label="Nome da loja" error={errors.name?.message} {...register('name')} />
        <Input label="Endereço (opcional)" error={errors.address?.message} {...register('address')} />

        {/* Color picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Cor primária da loja</label>

          {/* Paleta rápida */}
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setValue('primaryColor', c); setColorPreview(c) }}
                className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: c,
                  borderColor: colorPreview === c ? '#111' : 'transparent',
                  boxShadow: colorPreview === c ? '0 0 0 2px #fff, 0 0 0 4px #111' : undefined,
                }}
                title={c}
              />
            ))}
          </div>

          {/* Input HEX + color picker nativo */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                label=""
                placeholder="#9333ea"
                error={errors.primaryColor?.message}
                {...register('primaryColor')}
              />
            </div>

            <div className="flex flex-col items-center gap-1 mt-1">
              <label
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                title="Abrir color picker"
              >
                <Pipette className="w-4 h-4 text-gray-500" />
                <input
                  type="color"
                  className="sr-only"
                  value={colorPreview}
                  onChange={(e) => {
                    setValue('primaryColor', e.target.value)
                    setColorPreview(e.target.value)
                  }}
                />
              </label>
            </div>

            {/* Prévia */}
            <div
              className="w-10 h-10 rounded-xl border border-gray-100 shadow-sm shrink-0 transition-colors"
              style={{ backgroundColor: colorPreview }}
            />
          </div>

          {/* Exemplo de botão com a cor */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-xs text-gray-500">Prévia:</span>
            <button
              type="button"
              className="px-4 py-1.5 rounded-lg text-white text-sm font-medium shadow-sm"
              style={{ backgroundColor: colorPreview }}
            >
              Adicionar ao carrinho
            </button>
            <span
              className="text-sm font-semibold"
              style={{ color: colorPreview }}
            >
              R$ 29,90
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input label="DDI" placeholder="55" error={errors.whatsappDDI?.message} {...register('whatsappDDI')} />
          <div className="col-span-2">
            <Input label="WhatsApp (somente números)" placeholder="11999998888" error={errors.whatsappPhone?.message} {...register('whatsappPhone')} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Template da mensagem WhatsApp</label>
          <p className="text-xs text-gray-400 mb-1">Variáveis: {'{itens}'}, {'{total}'}, {'{cupom}'}</p>
          <textarea
            rows={5}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            {...register('whatsappTemplate')}
          />
          {errors.whatsappTemplate && <p className="text-xs text-red-600">{errors.whatsappTemplate.message}</p>}
        </div>

        <Button type="submit" loading={saving} className="gap-2">
          <Save className="w-4 h-4" />
          Salvar Configurações
        </Button>
      </form>

      {/* Sincronização */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Sincronização de Estoque</h2>
        <p className="text-sm text-gray-500">
          Sincroniza os produtos do sistema de estoque externo com o catálogo da loja.
          Configure as variáveis <code className="text-purple-600 text-xs">EXTERNAL_INVENTORY_API_URL</code> e <code className="text-purple-600 text-xs">EXTERNAL_INVENTORY_API_KEY</code> no ambiente.
        </p>
        <Button variant="outline" onClick={handleSync} loading={syncing} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Sincronizar Agora
        </Button>
      </div>
    </div>
  )
}
