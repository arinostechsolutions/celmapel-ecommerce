'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type UploadContext = 'product' | 'banner' | 'banner_mobile' | 'logo'

interface UploadResult {
  url: string
  publicId: string
}

interface ImageUploaderProps {
  context: UploadContext
  value?: string          // URL atual (preview)
  onChange: (result: UploadResult) => void
  onRemove?: () => void
  className?: string
  label?: string
}

const CONTEXT_META: Record<UploadContext, { label: string; dimensions: string; aspectRatio: string; hint: string }> = {
  banner: {
    label: 'Banner — Desktop',
    dimensions: '1200 × 400 px',
    aspectRatio: '3/1',
    hint: 'Proporcao 3:1 (paisagem). Exibida em telas grandes. Recomendado: 1200 × 400 px. JPG, PNG ou WebP, max 5 MB.',
  },
  banner_mobile: {
    label: 'Banner — Mobile',
    dimensions: '600 × 600 px',
    aspectRatio: '1/1',
    hint: 'Proporcao 1:1 (quadrado). Exibida em smartphones. Recomendado: 600 × 600 px. JPG, PNG ou WebP, max 5 MB.',
  },
  product: {
    label: 'Foto do produto',
    dimensions: '800 × 800 px',
    aspectRatio: '1/1',
    hint: 'Imagem quadrada do produto. Recomendado: 800 × 800 px (JPG, PNG ou WebP, máx. 5 MB)',
  },
  logo: {
    label: 'Logo',
    dimensions: '400 × 120 px',
    aspectRatio: '10/3',
    hint: 'Logo da loja em fundo transparente. Recomendado: 400 × 120 px (PNG, máx. 2 MB)',
  },
}

const MAX_BYTES = 5 * 1024 * 1024

export function ImageUploader({
  context,
  value,
  onChange,
  onRemove,
  className,
  label,
}: ImageUploaderProps) {
  const [dragging,    setDragging]    = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [preview,     setPreview]     = useState<string | null>(value ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const meta = CONTEXT_META[context]

  const uploadFile = useCallback(async (file: File) => {
    setError(null)

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato inválido. Use JPG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`Arquivo muito grande. Máximo ${context === 'logo' ? 2 : 5} MB.`)
      return
    }

    setUploading(true)
    setPreview(URL.createObjectURL(file))

    try {
      // 1. Pega assinatura do servidor
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ context, fileType: file.type }),
      })

      if (!signRes.ok) {
        const { error: msg } = await signRes.json().catch(() => ({}))
        throw new Error(msg ?? 'Erro ao assinar upload')
      }

      const { data: signData } = await signRes.json()
      const { signature, timestamp, apiKey, cloudName, folder } = signData

      // 2. Envia direto para Cloudinary
      const form = new FormData()
      form.append('file', file)
      form.append('signature', signature)
      form.append('timestamp', String(timestamp))
      form.append('api_key', apiKey)
      form.append('folder', folder)

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: form }
      )

      if (!uploadRes.ok) throw new Error('Falha no upload para Cloudinary')

      const uploadData = await uploadRes.json()
      const result: UploadResult = { url: uploadData.secure_url, publicId: uploadData.public_id }

      setPreview(result.url)
      onChange(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem')
      setPreview(value ?? null)
    } finally {
      setUploading(false)
    }
  }, [context, onChange, value])

  const handleFiles = (files: FileList | null) => {
    if (files?.[0]) uploadFile(files[0])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onRemove?.()
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label + dimensões */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label ?? meta.label}
        </label>
        <span className="text-xs font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
          {meta.dimensions}
        </span>
      </div>

      {/* Área de drop / preview */}
      <div
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden',
          dragging
            ? 'border-purple-500 bg-purple-50 scale-[1.01]'
            : preview
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 bg-white cursor-pointer',
        )}
        style={{ aspectRatio: meta.aspectRatio }}
        onClick={() => !preview && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
              unoptimized={preview.startsWith('blob:')}
            />

            {/* Overlay de carregamento */}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2 text-purple-600">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span className="text-xs font-medium">Enviando...</span>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            {!uploading && (
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="p-1.5 rounded-lg bg-white/90 shadow text-gray-700 hover:bg-white transition-colors"
                  title="Trocar imagem"
                >
                  <Upload className="w-4 h-4" />
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemove() }}
                    className="p-1.5 rounded-lg bg-white/90 shadow text-red-500 hover:bg-white transition-colors"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-sm text-purple-600 font-medium">Enviando...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Arraste ou{' '}
                    <span className="text-purple-600 underline underline-offset-2">clique para selecionar</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{meta.dimensions} · JPG, PNG ou WebP</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-400">{meta.hint}</p>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
