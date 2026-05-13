import mongoose, { Schema, Document, Model } from 'mongoose'

export interface CategoryDocument extends Document {
  storeId: mongoose.Types.ObjectId
  name: string
  slug: string
  icon: string
  order: number
  isVisible: boolean
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    icon: { type: String, default: 'Tag' },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

CategorySchema.index({ storeId: 1, isDeleted: 1, isVisible: 1, order: 1 })

const Category: Model<CategoryDocument> =
  mongoose.models.Category ?? mongoose.model<CategoryDocument>('Category', CategorySchema)

export default Category
