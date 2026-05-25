'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Store, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCPF, validateCPF } from '@/lib/security/validate'

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

function DashboardLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') ?? '/dashboard'

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError]   = useState('')
  const [cpfDisplay, setCpfDisplay]     = useState('')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  })

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    setCpfDisplay(formatCPF(digits))
    setValue('cpf', formatCPF(digits), { shouldValidate: digits.length === 11 })
  }

  const onSubmit = async (data: LoginForm) => {
    setServerError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: data.cpf, password: data.password, dashboard: true }),
    })

    const json = await res.json()

    if (!res.ok) {
      setServerError(json.error?.message ?? 'Erro ao realizar login')
      return
    }

    const user = json.data?.user
    if (!['master', 'owner', 'manager', 'viewer'].includes(user?.role)) {
      setServerError('Sem permissão de acesso ao dashboard')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
      <h2 className="font-semibold text-gray-900">Entrar na sua conta</h2>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="CPF"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          placeholder="000.000.000-00"
          value={cpfDisplay}
          error={errors.cpf?.message}
          {...register('cpf')}
          onChange={handleCpfChange}
        />

        <div className="relative">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Entrar
        </Button>
      </form>
    </div>
  )
}

export default function DashboardLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Celmapel</h1>
          <p className="text-sm text-gray-500 mt-1">Painel Administrativo</p>
        </div>

        <Suspense fallback={<div className="bg-white rounded-2xl shadow-card p-6 h-48 animate-pulse" />}>
          <DashboardLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
