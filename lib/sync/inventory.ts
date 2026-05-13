import connectDB from '@/lib/db/mongoose'
import Product from '@/lib/db/models/product'
import SyncLog from '@/lib/db/models/sync-log'
import Category from '@/lib/db/models/category'
import slugify from 'slugify'

interface ExternalProduct {
  id: string
  name: string
  description?: string
  price: number
  promoPrice?: number
  sku?: string
  category?: string
  imageUrl?: string
  active: boolean
  [key: string]: unknown
}

interface FieldMapping {
  id: string
  name: string
  description?: string
  price: string
  promoPrice?: string
  sku?: string
  category?: string
  imageUrl?: string
  active: string
}

const DEFAULT_MAPPING: FieldMapping = {
  id: 'id',
  name: 'name',
  description: 'description',
  price: 'price',
  promoPrice: 'promoPrice',
  sku: 'sku',
  category: 'category',
  imageUrl: 'imageUrl',
  active: 'active',
}

function mapExternalProduct(raw: Record<string, unknown>, mapping: FieldMapping): ExternalProduct {
  return {
    id: String(raw[mapping.id] ?? ''),
    name: String(raw[mapping.name] ?? ''),
    description: mapping.description ? String(raw[mapping.description] ?? '') : undefined,
    price: Number(raw[mapping.price] ?? 0),
    promoPrice: mapping.promoPrice ? Number(raw[mapping.promoPrice] ?? 0) || undefined : undefined,
    sku: mapping.sku ? String(raw[mapping.sku] ?? '') : undefined,
    category: mapping.category ? String(raw[mapping.category] ?? '') : undefined,
    imageUrl: mapping.imageUrl ? String(raw[mapping.imageUrl] ?? '') : undefined,
    active: Boolean(raw[mapping.active]),
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, apiKey: string, retries = 3): Promise<unknown[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30_000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      return res.json()
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(1000 * Math.pow(2, attempt)) // backoff exponencial
    }
  }
  return []
}

export async function syncInventory(
  storeId: string,
  triggeredBy: 'manual' | 'cron' = 'manual',
  fieldMapping?: Partial<FieldMapping>
): Promise<string> {
  await connectDB()

  const apiUrl = process.env.EXTERNAL_INVENTORY_API_URL
  const apiKey = process.env.EXTERNAL_INVENTORY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error('EXTERNAL_INVENTORY_API_URL e EXTERNAL_INVENTORY_API_KEY não configurados')
  }

  const startedAt = new Date()
  const log = await SyncLog.create({
    storeId,
    startedAt,
    status: 'running',
    triggeredBy,
  })

  const stats = {
    totalProcessed: 0,
    totalCreated: 0,
    totalUpdated: 0,
    totalErrors: 0,
    syncErrors: [] as string[],
  }

  try {
    const mapping = { ...DEFAULT_MAPPING, ...fieldMapping }
    const rawProducts = await fetchWithRetry(`${apiUrl}/products`, apiKey)

    for (const rawProduct of rawProducts) {
      stats.totalProcessed++
      try {
        const ext = mapExternalProduct(rawProduct as Record<string, unknown>, mapping)

        if (!ext.id || !ext.name) {
          stats.totalErrors++
          stats.syncErrors.push(`Produto sem id/nome: ${JSON.stringify(ext)}`)
          continue
        }

        // Resolver categoria
        let categoryId: string | undefined
        if (ext.category) {
          const cat = await Category.findOne({
            storeId,
            name: { $regex: new RegExp(`^${ext.category}$`, 'i') },
            isDeleted: false,
          })
          if (cat) categoryId = String(cat._id)
        }

        const slug = slugify(ext.name, { lower: true, strict: true })

        const updateData: Partial<{
          name: string; slug: string; description: string; price: number
          promoPrice: number; sku: string; categoryId: string
          images: { url: string; publicId: string; order: number }[]
          status: 'published' | 'inactive'; showOnSite: boolean
          isDeleted: boolean; externalId: string; storeId: string
        }> = {
          name: ext.name,
          slug,
          description: ext.description ?? '',
          price: ext.price,
          status: (ext.active ? 'published' : 'inactive') as 'published' | 'inactive',
          showOnSite: ext.active,
          isDeleted: false,
          externalId: ext.id,
          storeId,
        }
        if (ext.promoPrice) updateData.promoPrice = ext.promoPrice
        if (ext.sku) updateData.sku = ext.sku
        if (categoryId) updateData.categoryId = categoryId
        if (ext.imageUrl) {
          updateData.images = [{ url: ext.imageUrl, publicId: `external_${ext.id}`, order: 0 }]
        }

        const existing = await Product.findOne({ storeId, externalId: ext.id })

        if (existing) {
          await Product.findByIdAndUpdate(existing._id, { $set: updateData })
          stats.totalUpdated++
        } else {
          await Product.create(updateData)
          stats.totalCreated++
        }
      } catch (err) {
        stats.totalErrors++
        stats.syncErrors.push(err instanceof Error ? err.message : String(err))
      }
    }

    // Marcar como inativo produtos que não vieram na sync
    const externalIds = rawProducts
      .map((p) => String((p as Record<string, unknown>)[mapping.id]))
      .filter(Boolean)

    await Product.updateMany(
      { storeId, externalId: { $nin: externalIds }, isDeleted: false },
      { $set: { status: 'inactive', showOnSite: false } }
    )

    const completedAt = new Date()
    await SyncLog.findByIdAndUpdate(log._id, {
      status: 'completed',
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      totalProcessed: stats.totalProcessed,
      totalCreated: stats.totalCreated,
      totalUpdated: stats.totalUpdated,
      totalErrors: stats.totalErrors,
      syncErrors: stats.syncErrors,
    })

    return String(log._id)
  } catch (err) {
    const completedAt = new Date()
    await SyncLog.findByIdAndUpdate(log._id, {
      status: 'failed',
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      totalProcessed: stats.totalProcessed,
      totalCreated: stats.totalCreated,
      totalUpdated: stats.totalUpdated,
      totalErrors: stats.totalErrors,
      syncErrors: [...stats.syncErrors, err instanceof Error ? err.message : String(err)],
    })
    throw err
  }
}
