'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, KeyRound, LogOut, Eye, EyeOff,
  CheckCircle2, ShieldCheck, Phone, Mail, CreditCard, PartyPopper,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  name: string
  email?: string
  cpf?: string
  phone?: string
  role: string
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número'),
  confirmPassword: z.string().min(1, 'Confirme a nova senha'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
}).refine((d) => d.currentPassword !== d.newPassword, {
  message: 'A nova senha deve ser diferente da atual',
  path: ['newPassword'],
})

type ChangePasswordForm = z.infer<typeof ChangePasswordSchema>

const PASSWORD_RULES = [
  { label: 'Pelo menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',      test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',               test: (p: string) => /[0-9]/.test(p) },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNewAccount = searchParams.get('boas-vindas') === '1'
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSuccess, setPwSuccess]     = useState(false)
  const [pwError, setPwError]         = useState('')

  const {
    register, handleSubmit, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(ChangePasswordSchema), mode: 'onChange' })

  const newPassword   = watch('newPassword') ?? ''
  const confirmValue  = watch('confirmPassword') ?? ''
  const passwordsMatch = newPassword.length > 0 && confirmValue.length > 0 && newPassword === confirmValue

  // Carrega perfil
  useEffect(() => {
    const load = async () => {
      let res = await fetch('/api/auth/me')

      if (res.status === 401) {
        // Tenta renovar silenciosamente antes de redirecionar
        const refresh = await fetch('/api/auth/refresh', { method: 'POST' })
        if (refresh.ok) {
          res = await fetch('/api/auth/me')
        } else {
          router.push('/auth/login')
          return
        }
      }

      if (!res.ok) { router.push('/auth/login'); return }
      const json = await res.json()
      if (json?.data) setUser(json.data)
    }
    load().catch(() => router.push('/auth/login')).finally(() => setLoading(false))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const onChangePassword = async (data: ChangePasswordForm) => {
    setPwError('')
    setPwSuccess(false)
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) {
      setPwError(json.error?.message ?? 'Erro ao alterar senha')
      return
    }
    setPwSuccess(true)
    reset()
    // Após trocar senha, invalida sessão e pede novo login
    setTimeout(async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth/login')
    }, 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const roleLabel: Record<string, string> = {
    customer: 'Cliente',
    owner: 'Proprietário',
    manager: 'Gerente',
    viewer: 'Visualizador',
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      {/* Banner de boas-vindas */}
      {isNewAccount && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
            <PartyPopper className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">Conta criada com sucesso!</p>
            <p className="text-sm text-green-700 mt-0.5">Bem-vindo(a)! Sua conta já está ativa. Explore a loja ou complete seus dados abaixo.</p>
          </div>
        </div>
      )}

      {/* Header do perfil */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
          <User className="w-8 h-8 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-gray-900 truncate">{user.name}</p>
          <span className="inline-flex items-center text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full mt-1">
            {roleLabel[user.role] ?? user.role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {([
          { id: 'info',     label: 'Meus dados',  icon: User },
          { id: 'password', label: 'Senha',        icon: KeyRound },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Meus dados */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Informações da conta</h2>

          <InfoRow icon={User} label="Nome" value={user.name} />

          {user.cpf && (
            <InfoRow icon={CreditCard} label="CPF" value={user.cpf} note="identificador de login" />
          )}

          {user.email ? (
            <InfoRow icon={Mail} label="E-mail" value={user.email} />
          ) : (
            <InfoRow icon={Mail} label="E-mail" value="Não informado" muted />
          )}

          {user.phone ? (
            <InfoRow icon={Phone} label="Telefone" value={user.phone} />
          ) : (
            <InfoRow icon={Phone} label="Telefone" value="Não informado" muted />
          )}

          <div className="pt-2 flex items-center gap-2 text-xs text-gray-400 border-t border-gray-50">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Seus dados são protegidos conforme a LGPD</span>
          </div>
        </div>
      )}

      {/* Tab: Alterar senha */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Alterar senha</h2>

          {pwSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-semibold text-gray-900">Senha alterada!</p>
              <p className="text-sm text-gray-500">Você será redirecionado para o login em instantes...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4" noValidate>
              {pwError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {pwError}
                </div>
              )}

              {/* Senha atual */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Senha atual</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={inputCls(!!errors.currentPassword)}
                    {...register('currentPassword')}
                  />
                  <EyeBtn show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
                </div>
                {errors.currentPassword && <FieldError msg={errors.currentPassword.message} />}
              </div>

              {/* Nova senha */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nova senha</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Crie uma senha forte"
                    className={inputCls(!!errors.newPassword)}
                    {...register('newPassword')}
                  />
                  <EyeBtn show={showNew} onToggle={() => setShowNew(!showNew)} />
                </div>
                {newPassword.length > 0 && (
                  <div className="pt-1 space-y-1">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(newPassword)
                      return (
                        <div key={rule.label} className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-green-600' : 'text-gray-400')}>
                          <CheckCircle2 className={cn('w-3 h-3', ok ? 'text-green-500' : 'text-gray-300')} />
                          {rule.label}
                        </div>
                      )
                    })}
                  </div>
                )}
                {errors.newPassword && <FieldError msg={errors.newPassword.message} />}
              </div>

              {/* Confirmar nova senha */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repita a nova senha"
                    className={cn(
                      'w-full h-11 px-4 pr-11 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-purple-100',
                      passwordsMatch               ? 'border-green-400' :
                      confirmValue.length > 0      ? 'border-red-400'   :
                      errors.confirmPassword       ? 'border-red-400'   : 'border-gray-200 focus:border-purple-500'
                    )}
                    {...register('confirmPassword')}
                  />
                  <EyeBtn show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
                </div>
                {passwordsMatch && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Senhas conferem!
                  </p>
                )}
                {errors.confirmPassword && <FieldError msg={errors.confirmPassword.message} />}
              </div>

              <Button type="submit" className="w-full h-11" loading={isSubmitting}>
                Alterar senha
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Micro-componentes ────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon, label, value, note, muted,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  note?: string
  muted?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}{note && <span className="ml-1 text-purple-400">— {note}</span>}</p>
        <p className={cn('text-sm font-medium truncate', muted ? 'text-gray-400 italic' : 'text-gray-800')}>{value}</p>
      </div>
    </div>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-red-600">{msg}</p>
}

function EyeBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full h-11 px-4 pr-11 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-purple-100',
    hasError ? 'border-red-400' : 'border-gray-200 focus:border-purple-500'
  )
}
