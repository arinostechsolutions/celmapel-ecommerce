import mongoose, { Schema, Document, Model } from 'mongoose'

export type ActivityAction =
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'product_status_changed'
  | 'price_changed'
  | 'promo_price_changed'
  | 'image_uploaded'
  | 'image_deleted'
  | 'banner_created'
  | 'banner_deleted'
  | 'category_created'
  | 'category_deleted'
  | 'settings_updated'
  | 'sync_started'
  | 'sync_completed'
  | 'user_login'
  | 'user_logout'
  | 'password_changed'
  | 'permissions_updated'
  | 'user_role_changed'

export interface ActivityLogDocument extends Document {
  storeId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  userName: string
  action: ActivityAction
  entity: string
  entityId?: string
  details?: Record<string, unknown>
  createdAt: Date
}

const ActivityLogSchema = new Schema<ActivityLogDocument>(
  {
    storeId:  { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    userId:   { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    action:   { type: String, required: true, index: true },
    entity:   { type: String, required: true },
    entityId: { type: String },
    details:  { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

ActivityLogSchema.index({ storeId: 1, createdAt: -1 })

const ActivityLog: Model<ActivityLogDocument> =
  mongoose.models.ActivityLog ??
  mongoose.model<ActivityLogDocument>('ActivityLog', ActivityLogSchema)

export default ActivityLog
