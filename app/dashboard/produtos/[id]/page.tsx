export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import connectDB from '@/lib/db/mongoose'
import Product from '@/lib/db/models/product'
import Category from '@/lib/db/models/category'
import { serialize } from '@/lib/db/serialize'
import { EditProductForm } from './edit-product-form'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params

  if (!/^[a-f\d]{24}$/i.test(id)) notFound()

  let product: Record<string, unknown> | null = null
  let categories: { _id: string; name: string }[] = []

  try {
    await connectDB()
    const [raw, cats] = await Promise.all([
      Product.findOne({ _id: id, storeId: DEFAULT_STORE_ID, isDeleted: false })
        .populate('categoryId', 'name')
        .lean(),
      Category.find({ storeId: DEFAULT_STORE_ID, isDeleted: false, isVisible: true })
        .sort({ order: 1 })
        .select('name')
        .lean(),
    ])

    if (!raw) notFound()

    product    = serialize(raw) as unknown as Record<string, unknown>
    categories = serialize(cats) as unknown as typeof categories
  } catch {
    notFound()
  }

  return <EditProductForm product={product!} categories={categories} />
}
