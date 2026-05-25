import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ProductImage {
  url: string
  publicId: string
  alt?: string
  order: number
}

export interface ProductVariation {
  name: string
  options: string[]
}

export interface ProductDocument extends Document {
  storeId: mongoose.Types.ObjectId
  name: string
  slug: string
  description: string
  price: number
  promoPrice?: number
  sku?: string
  images: ProductImage[]
  categoryId: mongoose.Types.ObjectId
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
  stock: number
  isBestSeller: boolean
  bestSellerRank?: number
  weeklyUnitsSold?: number
  bestSellerSyncedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ProductImageSchema = new Schema<ProductImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false }
)

const ProductVariationSchema = new Schema<ProductVariation>(
  {
    name: { type: String, required: true },
    options: { type: [String], default: [] },
  },
  { _id: false }
)

const ProductSchema = new Schema<ProductDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    promoPrice: { type: Number, min: 0 },
    sku: { type: String, trim: true },
    images: { type: [ProductImageSchema], default: [] },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    tags: { type: [String], default: [] },
    variations: { type: [ProductVariationSchema], default: [] },
    status: {
      type: String,
      enum: ['published', 'draft', 'inactive'],
      default: 'draft',
      index: true,
    },
    showOnSite: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    viewCount: { type: Number, default: 0 },
    cartCount: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    externalId:          { type: String, index: true },
    stock:               { type: Number, default: 0 },
    isBestSeller:        { type: Boolean, default: false, index: true },
    bestSellerRank:      { type: Number },
    weeklyUnitsSold:     { type: Number },
    bestSellerSyncedAt:  { type: Date },
  },
  { timestamps: true }
)

ProductSchema.index({ storeId: 1, categoryId: 1, status: 1, showOnSite: 1 })
ProductSchema.index({ storeId: 1, isDeleted: 1, status: 1 })
ProductSchema.index({ storeId: 1, orderCount: -1 })
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' })

const Product: Model<ProductDocument> =
  mongoose.models.Product ?? mongoose.model<ProductDocument>('Product', ProductSchema)

export default Product
