import mongoose, { Schema, Document, Model } from 'mongoose'

export interface CouponDocument extends Document {
  storeId: mongoose.Types.ObjectId
  code: string
  type: 'percentage' | 'fixed'
  value: number
  maxUses: number
  usedCount: number
  minOrderValue?: number
  validUntil: Date
  isActive: boolean
  campaignId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CouponSchema = new Schema<CouponDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    maxUses: { type: Number, required: true, min: 1 },
    usedCount: { type: Number, default: 0 },
    minOrderValue: { type: Number, min: 0 },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
  },
  { timestamps: true }
)

CouponSchema.index({ storeId: 1, code: 1 }, { unique: true })

const Coupon: Model<CouponDocument> =
  mongoose.models.Coupon ?? mongoose.model<CouponDocument>('Coupon', CouponSchema)

export default Coupon
