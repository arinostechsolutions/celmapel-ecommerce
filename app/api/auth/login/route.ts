import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { comparePassword } from '@/lib/auth/password'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { validateCPF } from '@/lib/security/validate'
import { ok, badRequest, unauthorized, internalError } from '@/lib/api/response'
import { logActivity } from '@/lib/api/log-activity'

const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

const DASHBOARD_ROLES = ['master', 'owner', 'manager', 'viewer']

const LoginSchema = z.object({
  cpf: z
    .string()
    .min(1, 'CPF obrigatório')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11, 'CPF deve ter 11 dígitos')
    .refine((v) => validateCPF(v), 'CPF inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
  dashboard: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const rateLimitRes = await checkRateLimit(req, 'auth')
  if (rateLimitRes) return rateLimitRes

  try {
    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)
    }

    const { cpf, password, dashboard } = parsed.data

    await connectDB()

    // Busca por CPF (sempre retorna erro genérico para não revelar se o CPF existe)
    const user = await User.findOne({ cpf, isDeleted: false })

    if (!user) {
      return unauthorized('CPF ou senha inválidos')
    }

    if (user.isBlocked) {
      return unauthorized('Conta bloqueada. Entre em contato com o suporte.')
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remaining = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000)
      return unauthorized(`Conta bloqueada temporariamente. Tente novamente em ${remaining} min.`)
    }

    // Bloqueia antes de verificar a senha para não revelar que o usuário existe
    if (dashboard && !DASHBOARD_ROLES.includes(user.role)) {
      return unauthorized('CPF ou senha inválidos')
    }

    const isValid = await comparePassword(password, user.passwordHash)

    if (!isValid) {
      const attempts = (user.loginAttempts ?? 0) + 1
      const update: Record<string, unknown> = { loginAttempts: attempts }

      if (attempts >= MAX_ATTEMPTS) {
        update.lockUntil = new Date(Date.now() + LOCK_MS)
        update.loginAttempts = 0
      }

      await User.findByIdAndUpdate(user._id, update)
      return unauthorized('CPF ou senha inválidos')
    }

    await User.findByIdAndUpdate(user._id, {
      loginAttempts: 0,
      $unset: { lockUntil: '' },
    })

    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      ...(user.storeId ? { storeId: String(user.storeId) } : {}),
    }

    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    const tokens = [...(user.refreshTokens ?? []), refreshToken].slice(-5)
    await User.findByIdAndUpdate(user._id, { refreshTokens: tokens })

    if (user.storeId) {
      logActivity({
        storeId:  String(user.storeId),
        userId:   String(user._id),
        userName: user.name,
        action:   'user_login',
        entity:   'user',
        entityId: String(user._id),
        details:  { role: user.role },
      })
    }

    const response = ok({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    })

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    }

    response.cookies.set('access_token', accessToken, { ...cookieOpts, maxAge: 2 * 60 * 60 })
    response.cookies.set('refresh_token', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 })

    return response
  } catch (err) {
    return internalError(err)
  }
}
