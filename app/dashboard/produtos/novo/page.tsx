export const dynamic = 'force-dynamic'

import connectDB from '@/lib/db/mongoose'
import Category from '@/lib/db/models/category'
import { serialize } from '@/lib/db/serialize'
import { NewProductForm } from './new-product-form'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

export default async function NewProductPage() {
  let categories: { _id: string; name: string }[] = []
  try {
    await connectDB()
    const raw = await Category.find({ storeId: DEFAULT_STORE_ID, isDeleted: false, isVisible: true })
      .sort({ order: 1 })
      .select('name')
      .lean()
    categories = serialize(raw) as unknown as typeof categories
  } catch { /* sem banco */ }

  return <NewProductForm categories={categories} />
}
