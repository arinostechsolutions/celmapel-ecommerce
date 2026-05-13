export const dynamic = 'force-dynamic'
import connectDB from '@/lib/db/mongoose'
import Category from '@/lib/db/models/category'
import { CategoriesManager } from '@/components/dashboard/categories-manager'
import { serialize } from '@/lib/db/serialize'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

export default async function CategoriesPage() {
  let categories: unknown[] = []
  try {
    await connectDB()
    const raw = await Category.find({ storeId: DEFAULT_STORE_ID, isDeleted: false })
      .sort({ order: 1 })
      .lean()
    categories = serialize(raw)
  } catch { /* sem banco configurado */ }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Categorias</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie as categorias visíveis na loja</p>
      </div>
      <CategoriesManager categories={categories as Parameters<typeof CategoriesManager>[0]['categories']} />
    </div>
  )
}
