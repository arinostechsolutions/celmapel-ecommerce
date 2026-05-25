export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import connectDB from '@/lib/db/mongoose'
import Store from '@/lib/db/models/store'
import Category from '@/lib/db/models/category'
import { StoreShell } from '@/components/store/store-shell'
import { CategoryBar } from '@/components/store/category-bar'
import { StoreFooter } from '@/components/store/footer'
import { ThemeApplier } from '@/components/store/theme-applier'
import { UtmTracker } from '@/components/store/utm-tracker'
import { LightboxProvider } from '@/components/ui/image-lightbox'
import { AuthProvider } from '@/components/store/auth-context'
import { serialize } from '@/lib/db/serialize'
import { verifyAccessToken } from '@/lib/auth/jwt'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID

async function getStoreData() {
  try {
    await connectDB()
    const [store, categories] = await Promise.all([
      Store.findById(DEFAULT_STORE_ID).lean(),
      Category.find({ storeId: DEFAULT_STORE_ID, isDeleted: false, isVisible: true })
        .sort({ order: 1 })
        .lean(),
    ])
    return {
      store: store ? serialize(store) : null,
      categories: serialize(categories),
    }
  } catch {
    return { store: null, categories: [] }
  }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { store, categories } = await getStoreData()

  const primaryColor = (store as { primaryColor?: string })?.primaryColor ?? '#9333ea'

  const jar   = await cookies()
  const token = jar.get('access_token')?.value
  let isAuthenticated = false
  if (token) {
    try { verifyAccessToken(token); isAuthenticated = true } catch { /* expirado */ }
  }

  return (
    <AuthProvider isAuthenticated={isAuthenticated}>
    <LightboxProvider>
    <div className="min-h-screen bg-gray-50">
      <ThemeApplier primaryColor={primaryColor} />
      <Suspense><UtmTracker /></Suspense>
      <StoreShell
        storeName={store?.name ?? 'Celmapel Festas'}
        storeLogo={store?.logo}
      >
        <Suspense>
          <CategoryBar categories={categories as unknown as unknown as Parameters<typeof CategoryBar>[0]['categories']} />
        </Suspense>
        <main
          className="max-w-7xl mx-auto px-4"
          style={{ paddingTop: 'calc(var(--header-height) + var(--category-bar-height) + 1.5rem)', paddingBottom: '3rem' }}
        >
          {children}
        </main>
      </StoreShell>
      <StoreFooter store={store as unknown as Parameters<typeof StoreFooter>[0]['store']} />
    </div>
    </LightboxProvider>
    </AuthProvider>
  )
}
