export interface IUser {
  _id: string
  name: string
  email: string
  cpf?: string
  phone?: string
  passwordHash: string
  role: 'customer' | 'owner' | 'manager' | 'viewer' | 'master'
  permissions: string[]
  storeId?: string
  isBlocked: boolean
  loginAttempts: number
  lockUntil?: Date
  emailVerified?: Date
  twoFactorSecret?: string
  twoFactorEnabled: boolean
  refreshTokens: string[]
  createdAt: Date
  updatedAt: Date
}

export interface IStore {
  _id: string
  name: string
  slug: string
  logo?: string
  primaryColor: string
  whatsappPhone: string
  whatsappDDI: string
  whatsappTemplate: string
  businessHours: BusinessHour[]
  customDomain?: string
  address?: string
  deliveryEnabled: boolean
  pickupEnabled: boolean
  minDeliveryValue: number
  paymentMethods: string[]
  createdAt: Date
  updatedAt: Date
}

export interface BusinessHour {
  day: number // 0 = domingo, 6 = sábado
  open: string // HH:mm
  close: string // HH:mm
  closed: boolean
}

export interface IProduct {
  _id: string
  storeId: string
  name: string
  slug: string
  description: string
  price: number
  promoPrice?: number
  sku?: string
  images: ProductImage[]
  categoryId: string
  tags: string[]
  variations: ProductVariation[]
  status: 'published' | 'draft' | 'inactive'
  showOnSite: boolean
  isFeatured: boolean
  isDeleted: boolean
  deletedAt?: Date
  viewCount: number
  cartCount: number
  orderCount: number
  externalId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductImage {
  url: string
  publicId: string
  alt?: string
  order: number
}

export interface ProductVariation {
  name: string // ex: "Tamanho"
  options: string[] // ex: ["P", "M", "G"]
}

export interface ICategory {
  _id: string
  storeId: string
  name: string
  slug: string
  icon: string // Lucide icon name
  order: number
  isVisible: boolean
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IBanner {
  _id: string
  storeId: string
  title: string
  imageUrl: string
  imagePublicId: string
  linkUrl?: string
  startDate: Date
  endDate: Date
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ICampaign {
  _id: string
  storeId: string
  name: string
  description?: string
  productIds: string[]
  categoryIds: string[]
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent?: string
  utmTerm?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  clickCount: number
  couponId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ICoupon {
  _id: string
  storeId: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  maxUses: number
  usedCount: number
  minOrderValue?: number
  validUntil: Date
  isActive: boolean
  campaignId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ICartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  sku?: string
  selectedVariations?: Record<string, string>
}

export interface IActivityLog {
  _id: string
  storeId: string
  userId?: string
  userName: string
  action: string
  entity: string
  entityId?: string
  details?: Record<string, unknown>
  createdAt: Date
}

export interface ICart {
  _id: string
  userId?: string
  sessionId?: string
  storeId: string
  items: ICartItem[]
  couponId?: string
  discountAmount: number
  total: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface IOrder {
  _id: string
  storeId: string
  userId?: string
  sessionId?: string
  items: ICartItem[]
  subtotal: number
  discountAmount: number
  total: number
  couponId?: string
  status: 'initiated_whatsapp'
  whatsappUrl: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  campaignId?: string
  createdAt: Date
}

export interface IEvent {
  _id: string
  storeId: string
  userId?: string
  sessionId: string
  type: 'view' | 'add_to_cart' | 'remove_from_cart' | 'checkout_initiated'
  productId: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  createdAt: Date
}

export interface ISyncLog {
  _id: string
  storeId: string
  startedAt: Date
  completedAt?: Date
  status: 'running' | 'completed' | 'failed'
  totalProcessed: number
  totalCreated: number
  totalUpdated: number
  totalErrors: number
  errors: string[]
  triggeredBy: 'manual' | 'cron'
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
  total?: number
}
