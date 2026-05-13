import { NextRequest } from 'next/server'
import { z } from 'zod'
import { generateUploadSignature, type UploadContext } from '@/lib/cloudinary/sign'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'
import { ok, badRequest, unauthorized, forbidden, internalError } from '@/lib/api/response'

const ALLOWED_CONTEXTS: UploadContext[] = ['product', 'banner', 'banner_mobile', 'logo']

const SignSchema = z.object({
  context: z.enum(['product', 'banner', 'banner_mobile', 'logo']),
  fileType: z.string().refine(
    (v) => ['image/jpeg', 'image/png', 'image/webp'].includes(v),
    { message: 'Tipo de arquivo não permitido (use JPEG, PNG ou WebP)' }
  ),
})

export async function POST(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireDashboardAccess(payload)
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    const body = await req.json()
    const parsed = SignSchema.safeParse(body)

    if (!parsed.success) return badRequest('Dados inválidos', parsed.error.flatten().fieldErrors)

    const { context } = parsed.data as { context: UploadContext }

    if (!ALLOWED_CONTEXTS.includes(context)) {
      return badRequest('Contexto de upload inválido')
    }

    const signature = generateUploadSignature(context)
    return ok(signature)
  } catch (err) {
    return internalError(err)
  }
}
