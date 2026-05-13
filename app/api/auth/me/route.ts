import { NextRequest } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { requireAuth } from '@/lib/api/auth-guard'
import { ok, unauthorized, internalError } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req)
    await connectDB()

    const user = await User.findById(payload.sub).select('-passwordHash -refreshTokens').lean()
    if (!user) return unauthorized('Usuário não encontrado')

    return ok({
      id: String(user._id),
      name: user.name,
      email: user.email,
      cpf: user.cpf ? `***.***.${user.cpf.slice(6, 9)}-**` : undefined,
      phone: user.phone,
      role: user.role,
    })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return unauthorized()
    return internalError(err)
  }
}
