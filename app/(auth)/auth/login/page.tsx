'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ShoppingCart, Loader2 } from 'lucide-react'
import { validateCPF, formatCPF } from '@/lib/security/validate'

const LoginSchema = z.object({
  cpf: z
    .string()
    .min(1, 'CPF obrigatório')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11, 'CPF incompleto')
    .refine((v) => validateCPF(v), 'CPF inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginForm = z.infer<typeof LoginSchema>

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams?.get('next') ?? null

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError]   = useState('')
  const [cpfDisplay, setCpfDisplay]     = useState('')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  })

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits    = e.target.value.replace(/\D/g, '').slice(0, 11)
    const formatted = formatCPF(digits)
    setCpfDisplay(formatted)
    setValue('cpf', formatted, { shouldValidate: cpfDisplay.length > 0 })
  }

  const onSubmit = async (data: LoginForm) => {
    setServerError('')
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cpf: data.cpf, password: data.password }),
    })
    const json = await res.json()
    if (!res.ok) {
      setServerError(json.error?.message ?? 'Erro ao realizar login')
      return
    }
    const destination = next === 'checkout' ? '/?resume_checkout=1' : '/'
    router.push(destination)
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Entrar na conta</h1>
        <p className="text-sm text-gray-500">Use seu CPF e senha para acessar</p>
      </div>

      {/* Banner carrinho */}
      {next === 'checkout' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <ShoppingCart className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Seu carrinho está te esperando</p>
            <p className="text-xs text-amber-700 mt-0.5">Faça login para finalizar o pedido.</p>
          </div>
        </div>
      )}

      {/* Card do formulário */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* CPF */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">CPF</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpfDisplay}
              onChange={handleCpfChange}
              autoComplete="off"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
            {errors.cpf && <p className="text-xs text-red-600">{errors.cpf.message}</p>}
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 pt-1">
          Não tem conta?{' '}
          <Link
            href="/auth/cadastro"
            className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
