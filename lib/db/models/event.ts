import mongoose, { Schema, Document, Model } from 'mongoose'

export interface EventDocument extends Document {
  storeId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  sessionId: string
  type: 'view' | 'add_to_cart' | 'remove_from_cart' | 'checkout_initiated'
  productId: mongoose.Types.ObjectId
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  createdAt: Date
}

const EventSchema = new Schema<EventDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: String, required: true },
    type: {
      type: String,
      enum: ['view', 'add_to_cart', 'remove_from_cart', 'checkout_initiated'],
      required: true,
      index: true,
    },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

EventSchema.index({ storeId: 1, type: 1, createdAt: -1 })
EventSchema.index({ storeId: 1, productId: 1, type: 1 })
EventSchema.index({ sessionId: 1, productId: 1, type: 1 })

const Event: Model<EventDocument> =
  mongoose.models.Event ?? mongoose.model<EventDocument>('Event', EventSchema)

export default Event
