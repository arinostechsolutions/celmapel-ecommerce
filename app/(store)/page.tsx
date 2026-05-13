export const dynamic = 'force-dynamic'
import connectDB from '@/lib/db/mongoose'
import Product from '@/lib/db/models/product'
import Banner from '@/lib/db/models/banner'
import { BannerCarousel } from '@/components/store/banner-carousel'
import { ProductsSection } from '@/components/store/products-section'
import { serialize } from '@/lib/db/serialize'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

async function getHomeData() {
  try {
    await connectDB()
    const now = new Date()

    const [banners, featured, bestSellers, promoProducts] = await Promise.all([
      Banner.find({
        storeId: DEFAULT_STORE_ID,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).sort({ order: 1 }).lean(),

      Product.find({
        storeId: DEFAULT_STORE_ID,
        status: 'published',
        showOnSite: true,
        isFeatured: true,
        isDeleted: false,
      }).populate('categoryId', 'name slug').sort({ createdAt: -1 }).limit(8).lean(),

      Product.find({
        storeId: DEFAULT_STORE_ID,
        status: 'published',
        showOnSite: true,
        isDeleted: false,
      }).populate('categoryId', 'name slug').sort({ orderCount: -1 }).limit(8).lean(),

      Product.find({
        storeId: DEFAULT_STORE_ID,
        status: 'published',
        showOnSite: true,
        isDeleted: false,
        promoPrice: { $exists: true, $gt: 0 },
      }).populate('categoryId', 'name slug').sort({ createdAt: -1 }).limit(8).lean(),
    ])

    return {
      banners: serialize(banners),
      featured: serialize(featured),
      bestSellers: serialize(bestSellers),
      promoProducts: serialize(promoProducts),
    }
  } catch {
    return { banners: [], featured: [], bestSellers: [], promoProducts: [] }
  }
}

export default async function HomePage() {
  const { banners, featured, bestSellers, promoProducts } = await getHomeData()

  return (
    <div className="space-y-10">
      {banners.length > 0 && (
        <BannerCarousel banners={banners as Parameters<typeof BannerCarousel>[0]['banners']} />
      )}

      {featured.length > 0 && (
        <ProductsSection
          title="Produtos em Destaque"
          products={featured as Parameters<typeof ProductsSection>[0]['products']}
          viewAllHref="/busca"
        />
      )}

      {bestSellers.length > 0 && (
        <ProductsSection
          title="Mais Vendidos"
          products={bestSellers as Parameters<typeof ProductsSection>[0]['products']}
          viewAllHref="/busca?sort=orderCount"
        />
      )}

      {promoProducts.length > 0 && (
        <ProductsSection
          title="Promoções"
          products={promoProducts as Parameters<typeof ProductsSection>[0]['products']}
          viewAllHref="/busca"
          highlight
        />
      )}

      {featured.length === 0 && bestSellers.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Nenhum produto disponível</p>
          <p className="text-sm mt-1">Configure o DEFAULT_STORE_ID e rode o seed</p>
        </div>
      )}
    </div>
  )
}
