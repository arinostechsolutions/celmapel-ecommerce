import { NextRequest } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { hashPassword } from '@/lib/auth/password'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { validateCPF, phoneSchema, passwordSchema } from '@/lib/security/validate'
import { ok, badRequest, conflict, internalError } from '@/lib/api/response'

const RegisterSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim(),
  cpf: z
    .string()
    .min(1, 'CPF obrigatório')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11, 'CPF deve ter 11 dígitos')
    .refine((v) => validateCPF(v), 'CPF inválido'),
  email: z.string().email('E-mail inválido').toLowerCase().optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirmação de senha obrigatória'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export async function POST(req: NextRequest) {
  const rateLimitRes = await checkRateLimit(req, 'auth')
  if (rateLimitRes) return rateLimitRes

  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)
    }

    const { name, cpf, email, phone, password } = parsed.data

    await connectDB()

    // CPF único
    const existingCpf = await User.findOne({ cpf, isDeleted: false })
    if (existingCpf) return conflict('CPF já cadastrado')

    // E-mail único (se informado)
    if (email) {
      const existingEmail = await User.findOne({ email, isDeleted: false })
      if (existingEmail) return conflict('E-mail já cadastrado')
    }

    const passwordHash = await hashPassword(password)

    const user = await User.create({
      name,
      cpf,
      email: email || undefined,
      phone: phone || undefined,
      passwordHash,
      role: 'customer',
    })

    const payload = {
      sub: String(user._id),
      email: user.email ?? '',
      role: user.role,
    }

    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } })

    const response = ok(
      { user: { id: String(user._id), name: user.name, role: user.role } },
      201
    )

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    return internalError(err)
  }
}
