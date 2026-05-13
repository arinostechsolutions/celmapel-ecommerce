import { NextRequest } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { requireAuth } from '@/lib/api/auth-guard'
import { ok } from '@/lib/api/response'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req)
    const refreshToken = req.cookies.get('refresh_token')?.value

    await connectDB()
    if (refreshToken) {
      await User.findByIdAndUpdate(payload.sub, {
        $pull: { refreshTokens: refreshToken },
      })
    }
  } catch {
    // logout mesmo sem token válido
  }

  const response = ok({ message: 'Logout realizado' })
  response.cookies.set('access_token',  '', { maxAge: 0, path: '/' })
  response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' })
  return response
}
