import { NextRequest } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { ok, unauthorized, internalError } from '@/lib/api/response'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value

    if (!refreshToken) return unauthorized('Refresh token ausente')

    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      return unauthorized('Refresh token inválido ou expirado')
    }

    await connectDB()

    const user = await User.findOne({
      _id: payload.sub,
      refreshTokens: refreshToken,
      isDeleted: false,
      isBlocked: false,
    })

    if (!user) return unauthorized('Sessão inválida')

    // Rotação do refresh token
    const newTokenPayload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      ...(user.storeId ? { storeId: String(user.storeId) } : {}),
    }

    const newAccessToken = signAccessToken(newTokenPayload)
    const newRefreshToken = signRefreshToken(newTokenPayload)

    const updatedTokens = user.refreshTokens
      .filter((t: string) => t !== refreshToken)
      .concat(newRefreshToken)
      .slice(-5)

    await User.findByIdAndUpdate(user._id, { refreshTokens: updatedTokens })

    const response = ok({ accessToken: newAccessToken })

    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60,
      path: '/',
    })

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    return internalError(err)
  }
}
