import mongoose, { Schema, Document, Model } from 'mongoose'
import type { CartItem } from './cart'

export interface OrderDocument extends Document {
  storeId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  sessionId?: string
  items: CartItem[]
  subtotal: number
  discountAmount: number
  total: number
  couponId?: mongoose.Types.ObjectId
  status: 'initiated_whatsapp'
  whatsappUrl: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  campaignId?: mongoose.Types.ObjectId
  createdAt: Date
}

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    imageUrl: { type: String },
    selectedVariations: { type: Map, of: String },
  },
  { _id: false }
)

const OrderSchema = new Schema<OrderDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: String },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    status: { type: String, enum: ['initiated_whatsapp'], default: 'initiated_whatsapp' },
    whatsappUrl: { type: String, required: true },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

OrderSchema.index({ storeId: 1, createdAt: -1 })
OrderSchema.index({ storeId: 1, utmCampaign: 1, createdAt: -1 })

const Order: Model<OrderDocument> =
  mongoose.models.Order ?? mongoose.model<OrderDocument>('Order', OrderSchema)

export default Order
