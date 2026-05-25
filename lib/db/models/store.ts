import mongoose, { Schema, Document, Model } from 'mongoose'

export interface BusinessHour {
  day: number
  open: string
  close: string
  closed: boolean
}

export interface StoreDocument extends Document {
  name: string
  slug: string
  logo?: string
  logoPublicId?: string
  primaryColor: string
  whatsappPhone: string
  whatsappDDI: string
  whatsappTemplate: string
  businessHours: BusinessHour[]
  customDomain?: string
  address?: string
  deliveryEnabled: boolean
  pickupEnabled: boolean
  minDeliveryValue: number
  paymentMethods: string[]
  createdAt: Date
  updatedAt: Date
}

const BusinessHourSchema = new Schema<BusinessHour>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: String, default: '09:00' },
    close: { type: String, default: '18:00' },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
)

const StoreSchema = new Schema<StoreDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    logo: { type: String },
    logoPublicId: { type: String },
    primaryColor: { type: String, default: '#9333ea' },
    whatsappPhone: { type: String, required: true },
    whatsappDDI: { type: String, default: '55' },
    whatsappTemplate: {
      type: String,
      default:
        'Olá! Gostaria de fazer o seguinte pedido:\n\n{itens}\n\nTotal: {total}\n\n{cupom}Aguardo confirmação!',
    },
    businessHours: { type: [BusinessHourSchema], default: [] },
    customDomain: { type: String },
    address: { type: String },
    deliveryEnabled: { type: Boolean, default: true },
    pickupEnabled: { type: Boolean, default: true },
    minDeliveryValue: { type: Number, default: 0 },
    paymentMethods: { type: [String], default: ['pix', 'debit', 'credit'] },
  },
  { timestamps: true }
)

const Store: Model<StoreDocument> =
  mongoose.models.Store ?? mongoose.model<StoreDocument>('Store', StoreSchema)

export default Store
