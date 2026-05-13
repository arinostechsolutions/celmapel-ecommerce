import mongoose, { Schema, Document, Model } from 'mongoose'

export interface BannerDocument extends Document {
  storeId: mongoose.Types.ObjectId
  title: string
  imageUrl: string
  imagePublicId: string
  imageMobileUrl?: string
  imageMobilePublicId?: string
  linkUrl?: string
  startDate: Date
  endDate: Date
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const BannerSchema = new Schema<BannerDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    imageMobileUrl: { type: String },
    imageMobilePublicId: { type: String },
    linkUrl: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

BannerSchema.index({ storeId: 1, isActive: 1, startDate: 1, endDate: 1 })

const Banner: Model<BannerDocument> =
  mongoose.models.Banner ?? mongoose.model<BannerDocument>('Banner', BannerSchema)

export default Banner
