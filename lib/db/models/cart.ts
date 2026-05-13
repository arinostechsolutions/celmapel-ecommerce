import mongoose, { Schema, Document, Model } from 'mongoose'

export interface CartItem {
  productId: mongoose.Types.ObjectId
  name: string
  price: number
  quantity: number
  imageUrl?: string
  selectedVariations?: Record<string, string>
}

export interface CartDocument extends Document {
  userId?: mongoose.Types.ObjectId
  sessionId?: string
  storeId: mongoose.Types.ObjectId
  items: CartItem[]
  couponId?: mongoose.Types.ObjectId
  discountAmount: number
  total: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const CartItemSchema = new Schema<CartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
    selectedVariations: { type: Map, of: String },
  },
  { _id: false }
)

const CartSchema = new Schema<CartDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: String, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    items: { type: [CartItemSchema], default: [] },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
)

const Cart: Model<CartDocument> =
  mongoose.models.Cart ?? mongoose.model<CartDocument>('Cart', CartSchema)

export default Cart
