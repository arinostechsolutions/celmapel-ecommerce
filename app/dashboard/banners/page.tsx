export const dynamic = 'force-dynamic'
import connectDB from '@/lib/db/mongoose'
import Banner from '@/lib/db/models/banner'
import Category from '@/lib/db/models/category'
import { BannersManager } from '@/components/dashboard/banners-manager'
import { serialize } from '@/lib/db/serialize'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

export default async function BannersPage() {
  let banners: unknown[]    = []
  let categories: unknown[] = []
  try {
    await connectDB()
    const [rawBanners, rawCategories] = await Promise.all([
      Banner.find({ storeId: DEFAULT_STORE_ID }).sort({ order: 1 }).lean(),
      Category.find({ storeId: DEFAULT_STORE_ID, isDeleted: false, isVisible: true }).sort({ order: 1 }).lean(),
    ])
    banners    = serialize(rawBanners)
    categories = serialize(rawCategories)
  } catch { /* sem banco configurado */ }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Banners</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie os banners promocionais da loja</p>
      </div>
      <BannersManager
        banners={banners as unknown as Parameters<typeof BannersManager>[0]['banners']}
        categories={categories as unknown as Parameters<typeof BannersManager>[0]['categories']}
      />
    </div>
  )
}
