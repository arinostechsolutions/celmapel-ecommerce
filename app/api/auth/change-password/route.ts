import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { comparePassword, hashPassword } from '@/lib/auth/password'
import { requireAuth } from '@/lib/api/auth-guard'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { passwordSchema } from '@/lib/security/validate'
import { ok, badRequest, unauthorized, internalError } from '@/lib/api/response'

const Schema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirmação obrigatória'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
}).refine((d) => d.currentPassword !== d.newPassword, {
  message: 'A nova senha deve ser diferente da atual',
  path: ['newPassword'],
})

export async function POST(req: NextRequest) {
  const rateLimitRes = await checkRateLimit(req, 'auth')
  if (rateLimitRes) return rateLimitRes

  try {
    const payload = requireAuth(req)
    const body = await req.json()
    const parsed = Schema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)
    }

    const { currentPassword, newPassword } = parsed.data

    await connectDB()
    const user = await User.findById(payload.sub)
    if (!user) return unauthorized('Usuário não encontrado')

    const valid = await comparePassword(currentPassword, user.passwordHash)
    if (!valid) return unauthorized('Senha atual incorreta')

    const newHash = await hashPassword(newPassword)

    // Invalida todos os refresh tokens ao trocar a senha
    await User.findByIdAndUpdate(user._id, {
      passwordHash: newHash,
      refreshTokens: [],
      loginAttempts: 0,
      $unset: { lockUntil: '' },
    })

    return ok({ message: 'Senha alterada com sucesso' })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return internalError(err)
  }
}
