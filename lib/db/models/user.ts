import mongoose, { Schema, Document, Model } from 'mongoose'

export interface UserDocument extends Document {
  name: string
  email: string
  cpf?: string
  phone?: string
  passwordHash: string
  role: 'customer' | 'owner' | 'manager' | 'viewer' | 'master'
  permissions: string[]
  storeId?: mongoose.Types.ObjectId
  isBlocked: boolean
  loginAttempts: number
  lockUntil?: Date
  emailVerified?: Date
  twoFactorSecret?: string
  twoFactorEnabled: boolean
  refreshTokens: string[]
  passwordResetToken?: string
  passwordResetExpires?: Date
  isDeleted: boolean
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    cpf: { type: String, sparse: true, index: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'owner', 'manager', 'viewer', 'master'],
      default: 'customer',
    },
    permissions: { type: [String], default: [] },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },
    isBlocked: { type: Boolean, default: false },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    emailVerified: { type: Date },
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    refreshTokens: { type: [String], default: [] },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
)

UserSchema.index({ email: 1, isDeleted: 1 })
UserSchema.index({ storeId: 1, role: 1 })

const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>('User', UserSchema)

export default User
