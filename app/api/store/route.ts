import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Store from '@/lib/db/models/store'

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID ?? ''

/** Endpoint público — retorna apenas configurações necessárias para o checkout */
export async function GET() {
  try {
    await connectDB()
    const store = await Store.findById(DEFAULT_STORE_ID)
      .select('deliveryEnabled pickupEnabled minDeliveryValue paymentMethods')
      .lean()

    if (!store) {
      return NextResponse.json({ data: null }, { status: 404 })
    }

    return NextResponse.json({ data: store })
  } catch {
    return NextResponse.json({ data: null }, { status: 500 })
  }
}
