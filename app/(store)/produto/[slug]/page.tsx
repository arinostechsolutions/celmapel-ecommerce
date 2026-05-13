// Força renderização dinâmica: página depende de DB e não deve ser
// prerendered em build (MONGODB_URI pode não estar disponível em CI).
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import connectDB from '@/lib/db/mongoose'
import Product from '@/lib/db/models/product'
import { ProductDetail } from '@/components/store/product-detail'
import { serialize } from '@/lib/db/serialize'
import type { Metadata } from 'next'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

async function getProduct(slug: string) {
  try {
    await connectDB()
    const product = await Product.findOne({
      slug,
      storeId: DEFAULT_STORE_ID,
      isDeleted: false,
      status: 'published',
      showOnSite: true,
    })
      .populate('categoryId', 'name slug')
      .lean()

    return product ? serialize(product) : null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Produto não encontrado' }

  return {
    title: `${product.name} | Celmapel Festas`,
    description: product.description?.replace(/<[^>]+>/g, '').slice(0, 160),
    openGraph: {
      images: product.images?.[0]?.url ? [product.images[0].url] : [],
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  let related: ReturnType<typeof serialize>[] = []
  try {
    await connectDB()
    const rawRelated = await Product.find({
      storeId: DEFAULT_STORE_ID,
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      _id: { $ne: product._id },
      status: 'published',
      showOnSite: true,
      isDeleted: false,
    })
      .limit(4)
      .lean()
    related = serialize(rawRelated)
  } catch {
    // sem relacionados
  }

  return (
    <ProductDetail
      product={product as unknown as Parameters<typeof ProductDetail>[0]['product']}
      related={related as unknown as Parameters<typeof ProductDetail>[0]['related']}
    />
  )
}
