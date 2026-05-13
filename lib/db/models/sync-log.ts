import mongoose, { Schema, Document, Model } from 'mongoose'

export interface SyncLogDocument extends Document {
  storeId: mongoose.Types.ObjectId
  startedAt: Date
  completedAt?: Date
  status: 'running' | 'completed' | 'failed'
  totalProcessed: number
  totalCreated: number
  totalUpdated: number
  totalErrors: number
  syncErrors: string[]
  triggeredBy: 'manual' | 'cron'
  durationMs?: number
}

const SyncLogSchema = new Schema<SyncLogDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
    },
    totalProcessed: { type: Number, default: 0 },
    totalCreated: { type: Number, default: 0 },
    totalUpdated: { type: Number, default: 0 },
    totalErrors: { type: Number, default: 0 },
    syncErrors: { type: [String], default: [] },
    triggeredBy: { type: String, enum: ['manual', 'cron'], default: 'manual' },
    durationMs: { type: Number },
  },
  { timestamps: false }
)

SyncLogSchema.index({ storeId: 1, startedAt: -1 })

const SyncLog: Model<SyncLogDocument> =
  mongoose.models.SyncLog ?? mongoose.model<SyncLogDocument>('SyncLog', SyncLogSchema)

export default SyncLog
