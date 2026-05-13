'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, ShieldCheck, ShoppingCart } from 'lucide-react'
import { validateCPF, formatCPF } from '@/lib/security/validate'
import { Button } from '@/components/ui/button'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') ?? null
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [cpfDisplay, setCpfDisplay] = useState('')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  })

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    const formatted = formatCPF(digits)
    setCpfDisplay(formatted)
    setValue('cpf', formatted, { shouldValidate: cpfDisplay.length > 0 })
  }

  const onSubmit = async (data: LoginForm) => {
    setServerError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: data.cpf, password: data.password }),
    })
    const json = await res.json()
    if (!res.ok) {
      setServerError(json.error?.message ?? 'Erro ao realizar login')
      return
    }
    // Se veio do checkout, retorna à loja sinalizando para reabrir o checkout
    const destination = next === 'checkout' ? '/?resume_checkout=1' : '/'
    router.push(destination)
    router.refresh()
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-7 h-7 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Entrar na sua conta</h1>
        <p className="text-sm text-gray-500 mt-1">Use seu CPF e senha para acessar</p>
      </div>

      {next === 'checkout' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4">
          <ShoppingCart className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Seu carrinho está te esperando</p>
            <p className="text-xs text-amber-700 mt-0.5">Faça login para finalizar o pedido. Os itens foram salvos.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* CPF */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">CPF</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpfDisplay}
              onChange={handleCpfChange}
              autoComplete="off"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
            {errors.cpf && (
              <p className="text-xs text-red-600">{errors.cpf.message}</p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11" loading={isSubmitting}>
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Não tem conta?{' '}
          <Link href="/auth/cadastro" className="text-purple-600 hover:text-purple-700 font-semibold">
            Criar conta
          </Link>
        </p>
      </div>

      {/* Segurança */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Seus dados são protegidos com criptografia</span>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
