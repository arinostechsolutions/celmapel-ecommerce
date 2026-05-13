import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Variáveis de ambiente do Upstash Redis não configuradas')
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

export const CACHE_KEYS = {
  storeConfig: (storeId: string) => `store:${storeId}:config`,
  categories: (storeId: string) => `store:${storeId}:categories`,
  featuredProducts: (storeId: string) => `store:${storeId}:featured`,
  banners: (storeId: string) => `store:${storeId}:banners`,
  productDetail: (slug: string) => `product:${slug}`,
  loginAttempts: (ip: string) => `rate:login:${ip}`,
  accountLock: (email: string) => `lock:account:${email}`,
}

export const CACHE_TTL = {
  storeConfig: 300,    // 5 minutos
  categories: 300,
  featuredProducts: 60,
  banners: 60,
  productDetail: 120,
}
