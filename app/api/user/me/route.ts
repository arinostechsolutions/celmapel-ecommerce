import { NextRequest } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { requireAuth } from '@/lib/api/auth-guard'
import { ok, unauthorized, internalError } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
    } catch {
      return unauthorized()
    }

    await connectDB()
    const user = await User.findById(payload.sub, '-passwordHash -refreshTokens -twoFactorSecret').lean()
    if (!user) return unauthorized()

    return ok(user)
  } catch (err) {
    return internalError(err)
  }
}

// LGPD: anonimização de dados pessoais
export async function DELETE(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
    } catch {
      return unauthorized()
    }

    await connectDB()

    const anonEmail = `deleted_${payload.sub}@anon.invalid`
    await User.findByIdAndUpdate(payload.sub, {
      name: 'Usuário Removido',
      email: anonEmail,
      cpf: undefined,
      phone: undefined,
      isDeleted: true,
      deletedAt: new Date(),
      refreshTokens: [],
      passwordHash: 'deleted',
    })

    const response = ok({ message: 'Conta removida com sucesso' })
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    return response
  } catch (err) {
    return internalError(err)
  }
}
