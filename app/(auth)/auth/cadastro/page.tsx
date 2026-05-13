'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, UserPlus, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { validateCPF, formatCPF } from '@/lib/security/validate'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Schema ───────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim(),
  cpf: z
    .string()
    .min(1, 'CPF obrigatório')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11, 'CPF incompleto')
    .refine((v) => validateCPF(v), 'CPF inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número'),
  confirmPassword: z.string().min(1, 'Confirme a senha'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof RegisterSchema>

// ─── Regras de senha ──────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { label: 'Pelo menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Uma letra maiúscula',      test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Um número',               test: (p: string) => /[0-9]/.test(p) },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [cpfDisplay, setCpfDisplay]   = useState('')
  const [cpfValid, setCpfValid]       = useState<boolean | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onChange',
  })

  const name            = watch('name') ?? ''
  const passwordValue   = watch('password') ?? ''
  const confirmValue    = watch('confirmPassword') ?? ''

  const passwordRulesOk  = PASSWORD_RULES.every((r) => r.test(passwordValue))
  const passwordsMatch   = passwordValue.length > 0 && confirmValue.length > 0 && passwordValue === confirmValue
  const passwordsMismatch = confirmValue.length > 0 && !passwordsMatch

  // Botão só habilita quando todos os obrigatórios estão corretos
  const canSubmit =
    name.trim().length >= 2 &&
    cpfValid === true &&
    passwordRulesOk &&
    passwordsMatch &&
    !isSubmitting

  // ── CPF ──────────────────────────────────────────────────────────────────────

  const [phoneDisplay, setPhoneDisplay] = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 10) {
      // Celular: (XX) XXXXX-XXXX
      formatted = digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (digits.length > 6) {
      // Fixo: (XX) XXXX-XXXX (parcial)
      formatted = digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    } else if (digits.length > 2) {
      formatted = digits.replace(/(\d{2})(\d+)/, '($1) $2')
    } else if (digits.length > 0) {
      formatted = `(${digits}`
    }
    setPhoneDisplay(formatted)
    setValue('phone', formatted, { shouldValidate: false })
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits    = e.target.value.replace(/\D/g, '').slice(0, 11)
    const formatted = formatCPF(digits)
    setCpfDisplay(formatted)
    setValue('cpf', formatted, { shouldValidate: false })
    setCpfValid(digits.length === 11 ? validateCPF(digits) : null)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = async (data: RegisterForm) => {
    setServerError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        cpf: data.cpf,
        email: data.email || undefined,
        phone: data.phone || undefined,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setServerError(json.error?.message ?? 'Erro ao criar conta')
      return
    }
    router.push('/perfil?boas-vindas=1')
    router.refresh()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-7 h-7 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
        <p className="text-sm text-gray-500 mt-1">Seus dados ficam protegidos conosco</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          {/* Nome */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Nome completo <Required />
            </label>
            <input
              type="text"
              placeholder="João Silva"
              autoComplete="name"
              className={inputCls(!!errors.name)}
              {...register('name')}
            />
            <FieldError msg={errors.name?.message} />
          </div>

          {/* CPF — identificador principal */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              CPF <Required />
              <span className="text-xs font-normal text-gray-400 ml-1">— usado para entrar na conta</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpfDisplay}
                onChange={handleCpfChange}
                autoComplete="off"
                className={cn(
                  'w-full h-11 px-4 pr-10 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-purple-100',
                  cpfValid === true  && 'border-green-400',
                  cpfValid === false && 'border-red-400',
                  cpfValid === null  && 'border-gray-200 focus:border-purple-500',
                )}
              />
              {cpfValid === true  && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
              {cpfValid === false && <XCircle      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
            </div>
            {cpfValid === true  && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> CPF válido</p>}
            {cpfValid === false && <p className="text-xs text-red-600">CPF inválido — verifique os dígitos</p>}
          </div>

          {/* E-mail (opcional) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              E-mail <Optional />
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              className={inputCls(!!errors.email)}
              {...register('email')}
            />
            <FieldError msg={errors.email?.message} />
          </div>

          {/* Telefone (opcional) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Telefone <Optional />
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              value={phoneDisplay}
              onChange={handlePhoneChange}
              className={inputCls(false)}
            />
          </div>

          {/* Senha */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Senha <Required />
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Crie uma senha forte"
                autoComplete="new-password"
                className={inputCls(!!errors.password)}
                {...register('password')}
              />
              <EyeToggle show={showPass} onToggle={() => setShowPass(!showPass)} />
            </div>

            {/* Checklist de requisitos */}
            {passwordValue.length > 0 && (
              <div className="pt-1 space-y-1">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(passwordValue)
                  return (
                    <div key={rule.label} className={cn('flex items-center gap-1.5 text-xs transition-colors', passed ? 'text-green-600' : 'text-gray-400')}>
                      <CheckCircle2 className={cn('w-3 h-3', passed ? 'text-green-500' : 'text-gray-300')} />
                      {rule.label}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Confirmar senha */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Confirmar senha <Required />
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repita a senha"
                autoComplete="new-password"
                className={cn(
                  'w-full h-11 px-4 pr-11 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-purple-100',
                  passwordsMatch   && 'border-green-400',
                  passwordsMismatch && 'border-red-400',
                  !passwordsMatch && !passwordsMismatch && 'border-gray-200 focus:border-purple-500',
                )}
                {...register('confirmPassword')}
              />
              <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
            </div>

            {/* Feedback de confirmação */}
            {passwordsMatch && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Senhas conferem!
              </p>
            )}
            {passwordsMismatch && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> As senhas não coincidem
              </p>
            )}
          </div>

          <p className="text-xs text-gray-400 pt-1">
            Ao criar uma conta você concorda com nossa{' '}
            <Link href="/politica-de-privacidade" className="text-purple-600 underline">
              Política de Privacidade
            </Link>.
          </p>

          <Button
            type="submit"
            className="w-full h-11 transition-opacity"
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            Criar conta
          </Button>

          {/* Resumo do que falta */}
          {!canSubmit && !isSubmitting && (
            <p className="text-center text-xs text-gray-400">
              {name.trim().length < 2
                ? 'Preencha seu nome'
                : cpfValid !== true
                ? 'Informe um CPF válido'
                : !passwordRulesOk
                ? 'A senha não atende os requisitos'
                : !passwordsMatch
                ? 'Confirme a senha corretamente'
                : ''}
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-semibold">
            Entrar
          </Link>
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>CPF criptografado e protegido pela LGPD</span>
      </div>
    </>
  )
}

// ─── Micro-componentes ────────────────────────────────────────────────────────

function Required() {
  return <span className="text-red-500 ml-0.5">*</span>
}

function Optional() {
  return <span className="text-xs font-normal text-gray-400 ml-1">(opcional)</span>
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-red-600">{msg}</p>
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      tabIndex={-1}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-purple-100',
    hasError ? 'border-red-400' : 'border-gray-200 focus:border-purple-500'
  )
}
