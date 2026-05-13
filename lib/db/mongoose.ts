import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalWithMongoose = global as typeof globalThis & { mongoose?: MongooseCache }

const cached: MongooseCache = globalWithMongoose.mongoose ?? { conn: null, promise: null }

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cached
}

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) throw new Error('MONGODB_URI não definida nas variáveis de ambiente')

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default connectDB
