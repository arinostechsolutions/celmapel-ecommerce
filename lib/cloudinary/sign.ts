import crypto from 'crypto'

const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME

if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
  // Não lançar erro aqui — apenas no momento de uso, para não quebrar builds
}

export type UploadContext = 'product' | 'banner' | 'banner_mobile' | 'logo'

const CONTEXT_FOLDER: Record<UploadContext, string> = {
  product:       'selmapel/products',
  banner:        'selmapel/banners',
  banner_mobile: 'selmapel/banners/mobile',
  logo:          'selmapel/logos',
}

interface SignatureResult {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  folder: string
}

export function generateUploadSignature(
  context: UploadContext,
  overrides?: Record<string, string>
): SignatureResult {
  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    throw new Error('Credenciais Cloudinary não configuradas')
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = CONTEXT_FOLDER[context]

  const params: Record<string, string | number> = {
    folder,
    timestamp,
    ...overrides,
  }

  const sortedKeys = Object.keys(params).sort()
  const paramString = sortedKeys.map((k) => `${k}=${params[k]}`).join('&')

  const signature = crypto
    .createHash('sha256')
    .update(paramString + CLOUDINARY_API_SECRET)
    .digest('hex')

  return {
    signature,
    timestamp,
    apiKey: CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
    folder,
  }
}

export async function destroyCloudinaryAsset(publicId: string): Promise<boolean> {
  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    throw new Error('Credenciais Cloudinary não configuradas')
  }

  const timestamp = Math.round(Date.now() / 1000)
  const paramString = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
  const signature = crypto.createHash('sha256').update(paramString).digest('hex')

  const formData = new URLSearchParams({
    public_id: publicId,
    signature,
    api_key: CLOUDINARY_API_KEY,
    timestamp: String(timestamp),
  })

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    }
  )

  const data = await res.json()
  return data.result === 'ok'
}
