import mongoose, { Schema, Document, Model } from 'mongoose'

export interface CampaignDocument extends Document {
  storeId: mongoose.Types.ObjectId
  name: string
  description?: string
  productIds: mongoose.Types.ObjectId[]
  categoryIds: mongoose.Types.ObjectId[]
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent?: string
  utmTerm?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  clickCount: number
  couponId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CampaignSchema = new Schema<CampaignDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    utmSource: { type: String, required: true },
    utmMedium: { type: String, required: true },
    utmCampaign: { type: String, required: true },
    utmContent: { type: String },
    utmTerm: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    clickCount: { type: Number, default: 0 },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
  },
  { timestamps: true }
)

CampaignSchema.index({ storeId: 1, isActive: 1 })

const Campaign: Model<CampaignDocument> =
  mongoose.models.Campaign ?? mongoose.model<CampaignDocument>('Campaign', CampaignSchema)

export default Campaign
