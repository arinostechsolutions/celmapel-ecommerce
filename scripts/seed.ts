import { config } from 'dotenv'
config({ path: '.env.local' })
import mongoose from 'mongoose'
import Store from '../lib/db/models/store'
import User from '../lib/db/models/user'
import Category from '../lib/db/models/category'
import Product from '../lib/db/models/product'
import Banner from '../lib/db/models/banner'
import Campaign from '../lib/db/models/campaign'
import Coupon from '../lib/db/models/coupon'
import Order from '../lib/db/models/order'
import Event from '../lib/db/models/event'
import { hashPassword } from '../lib/auth/password'

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/selmapel'

const CATEGORIES = [
  { name: 'Promoções', icon: 'Tag', order: 0 },
  { name: 'Balas', icon: 'Candy', order: 1 },
  { name: 'Chocolates', icon: 'Chocolate', order: 2 },
  { name: 'Biscoitos Salgados', icon: 'Cookie', order: 3 },
  { name: 'Outros', icon: 'ShoppingBag', order: 4 },
]

const PRODUCT_TEMPLATES = [
  { name: 'Bala Recheada Morango 500g', cat: 'Balas', price: 12.90, tags: ['Novidade'] },
  { name: 'Bala de Goma Sortida 400g', cat: 'Balas', price: 9.90, promoPrice: 7.90, tags: ['Promoção'] },
  { name: 'Bala Mastigável Frutas Tropicais 250g', cat: 'Balas', price: 6.50, tags: [] },
  { name: 'Bala de Menta Extra Forte 300g', cat: 'Balas', price: 5.90, tags: [] },
  { name: 'Bala Azedinha Mix 350g', cat: 'Balas', price: 8.90, tags: ['Mais Vendido'] },
  { name: 'Chocolate ao Leite Premium 200g', cat: 'Chocolates', price: 18.90, tags: ['Mais Vendido'] },
  { name: 'Chocolate Trufado Recheado 150g', cat: 'Chocolates', price: 22.90, promoPrice: 18.90, tags: ['Promoção', 'Novidade'] },
  { name: 'Bombom Caixa 500g Sortido', cat: 'Chocolates', price: 35.90, tags: ['Mais Vendido'] },
  { name: 'Chocolate Branco Especial 180g', cat: 'Chocolates', price: 16.90, tags: [] },
  { name: 'Kit Chocolates Temáticos Festa 12un', cat: 'Chocolates', price: 45.00, tags: ['Novidade'] },
  { name: 'Biscoito Salgado Cream Cracker 400g', cat: 'Biscoitos Salgados', price: 7.90, tags: [] },
  { name: 'Torrada Integral Multigrãos 150g', cat: 'Biscoitos Salgados', price: 8.90, tags: ['Novidade'] },
  { name: 'Biscoito Club Social Queijo 144g', cat: 'Biscoitos Salgados', price: 5.50, tags: ['Mais Vendido'] },
  { name: 'Biscoito Água e Sal Tradicional 350g', cat: 'Biscoitos Salgados', price: 6.90, tags: [] },
  { name: 'Biscoito Recheado Baunilha 150g', cat: 'Biscoitos Salgados', price: 4.90, promoPrice: 3.90, tags: ['Promoção'] },
  { name: 'Kit Festa Temático Completo 50 Unidades', cat: 'Outros', price: 89.90, tags: ['Mais Vendido', 'Novidade'] },
  { name: 'Lembrancinha Personalizada 10un', cat: 'Outros', price: 25.00, tags: [] },
  { name: 'Embalagem Decorativa Festa 20un', cat: 'Outros', price: 15.90, tags: [] },
  { name: 'Caixa Surpresa para Doces', cat: 'Outros', price: 12.00, tags: ['Novidade'] },
  { name: 'Bandeja Descartável Festa 10un', cat: 'Outros', price: 8.50, tags: [] },
  { name: 'Bala Pé de Moleque 500g', cat: 'Balas', price: 11.90, tags: ['Mais Vendido'] },
  { name: 'Jujuba Ursinhos Mix 400g', cat: 'Balas', price: 10.90, tags: [] },
  { name: 'Chiclete Menta c/20 unidades', cat: 'Balas', price: 7.50, tags: [] },
  { name: 'Chocolate Meio Amargo Artesanal 200g', cat: 'Chocolates', price: 28.90, promoPrice: 24.90, tags: ['Promoção'] },
  { name: 'Pão de Mel Individual 50g', cat: 'Chocolates', price: 4.90, promoPrice: 3.90, tags: ['Promoção'] },
  { name: 'Biscoito Palha Italiana 300g', cat: 'Biscoitos Salgados', price: 13.90, tags: ['Novidade'] },
  { name: 'Biscoito Integral Aveia e Mel 200g', cat: 'Biscoitos Salgados', price: 9.90, tags: [] },
  { name: 'Balinha de Coco 500g', cat: 'Balas', price: 14.90, tags: ['Novidade'] },
  { name: 'Kit Bolo Temático Unicórnio', cat: 'Outros', price: 65.00, tags: ['Mais Vendido'] },
  { name: 'Marshmallow Colorido 250g', cat: 'Outros', price: 11.50, tags: ['Promoção'] },
]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('Conectado ao MongoDB')

  // Limpar dados existentes
  await Promise.all([
    Store.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Banner.deleteMany({}),
    Campaign.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    Event.deleteMany({}),
  ])
  console.log('Dados anteriores removidos')

  // 1. Loja
  const store = await Store.create({
    name: 'Celmapel Festas',
    slug: 'celmapel',
    primaryColor: '#9333ea',
    whatsappPhone: '11999998888',
    whatsappDDI: '55',
    whatsappTemplate: 'Olá! Gostaria de fazer o seguinte pedido:\n\n{itens}\n\n{cupom}*Total: {total}*\n\nAguardo confirmação!',
    address: 'Rua das Festas, 123 - São Paulo, SP',
    businessHours: [
      { day: 0, open: '10:00', close: '15:00', closed: false },
      { day: 1, open: '09:00', close: '18:00', closed: false },
      { day: 2, open: '09:00', close: '18:00', closed: false },
      { day: 3, open: '09:00', close: '18:00', closed: false },
      { day: 4, open: '09:00', close: '18:00', closed: false },
      { day: 5, open: '09:00', close: '18:00', closed: false },
      { day: 6, open: '09:00', close: '14:00', closed: false },
    ],
  })
  console.log(`Loja criada: ${store.name} (${store._id})`)

  // Atualizar .env com DEFAULT_STORE_ID (informativo)
  console.log(`\nAdicione ao .env: DEFAULT_STORE_ID=${store._id}\n`)

  // 2. Usuário admin
  const adminHash = await hashPassword('Admin@123')
  const admin = await User.create({
    name: 'Administrador Celmapel',
    email: 'admin@celmapel.com.br',
    cpf: '11144477735', // CPF de teste válido
    passwordHash: adminHash,
    role: 'owner',
    storeId: store._id,
  })
  console.log(`Admin criado: ${admin.email}`)

  // 3. Clientes de exemplo
  const customerHash = await hashPassword('Cliente@123')
  const customers = await User.insertMany([
    { name: 'Ana Lima', email: 'ana@exemplo.com', passwordHash: customerHash, role: 'customer', phone: '11988887777' },
    { name: 'Bruno Carvalho', email: 'bruno@exemplo.com', passwordHash: customerHash, role: 'customer', phone: '11977776666' },
    { name: 'Carla Mendes', email: 'carla@exemplo.com', passwordHash: customerHash, role: 'customer' },
    { name: 'Daniel Souza', email: 'daniel@exemplo.com', passwordHash: customerHash, role: 'customer' },
    { name: 'Eva Santos', email: 'eva@exemplo.com', passwordHash: customerHash, role: 'customer' },
  ])
  console.log(`${customers.length} clientes criados`)

  // 4. Categorias
  const categories = await Category.insertMany(
    CATEGORIES.map((cat) => ({ ...cat, storeId: store._id, slug: cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))
  )
  const catMap = Object.fromEntries(categories.map((c) => [c.name, c]))
  console.log(`${categories.length} categorias criadas`)

  // 5. Produtos
  const now = new Date()
  const products = await Product.insertMany(
    PRODUCT_TEMPLATES.map((p, i) => {
      const cat = catMap[p.cat]
      const seed = `celmapel-${i}-${p.name.slice(0, 10)}`
      return {
        storeId: store._id,
        name: p.name,
        slug: p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: `<p>${p.name} — produto de alta qualidade, selecionado especialmente para a sua festa!</p>`,
        price: p.price,
        ...(p.promoPrice ? { promoPrice: p.promoPrice } : {}),
        categoryId: cat?._id,
        tags: p.tags,
        images: [
          {
            url: `https://picsum.photos/seed/${seed}/400/400`,
            publicId: `external_${i}`,
            alt: p.name,
            order: 0,
          },
        ],
        status: 'published',
        showOnSite: true,
        isFeatured: i < 6,
        viewCount: Math.floor(Math.random() * 500),
        cartCount: Math.floor(Math.random() * 100),
        orderCount: Math.floor(Math.random() * 50),
      }
    })
  )
  console.log(`${products.length} produtos criados`)

  // 6. Banners
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  await Banner.insertMany([
    {
      storeId: store._id,
      title: 'Promoção de Inverno — Até 30% OFF',
      imageUrl: 'https://picsum.photos/seed/banner1/1200/400',
      imagePublicId: 'banners/banner1',
      linkUrl: '/categoria/promocoes',
      startDate: new Date(now.getTime() - 1000),
      endDate: future,
      order: 0,
      isActive: true,
    },
    {
      storeId: store._id,
      title: 'Novidades de Chocolates Premium',
      imageUrl: 'https://picsum.photos/seed/banner2/1200/400',
      imagePublicId: 'banners/banner2',
      linkUrl: '/categoria/chocolates',
      startDate: new Date(now.getTime() - 1000),
      endDate: future,
      order: 1,
      isActive: true,
    },
  ])
  console.log('2 banners criados')

  // 7. Campanhas
  const campaigns = await Campaign.insertMany([
    {
      storeId: store._id,
      name: 'Campanha Redes Sociais Junho',
      description: 'Campanha para Instagram e TikTok',
      utmSource: 'instagram',
      utmMedium: 'social',
      utmCampaign: 'junho-2026',
      utmContent: 'stories',
      startDate: now,
      endDate: future,
      isActive: true,
      clickCount: 145,
    },
    {
      storeId: store._id,
      name: 'Google Ads — Festas',
      description: 'Anúncios no Google para busca por festas',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'festas-sp',
      startDate: now,
      endDate: future,
      isActive: true,
      clickCount: 320,
    },
    {
      storeId: store._id,
      name: 'WhatsApp Marketing',
      description: 'Links compartilhados no WhatsApp',
      utmSource: 'whatsapp',
      utmMedium: 'messaging',
      utmCampaign: 'compartilhamento',
      startDate: now,
      endDate: future,
      isActive: true,
      clickCount: 89,
    },
  ])
  console.log(`${campaigns.length} campanhas criadas`)

  // 8. Cupom
  await Coupon.create({
    storeId: store._id,
    code: 'BEMVINDO10',
    type: 'percentage',
    value: 10,
    maxUses: 100,
    validUntil: future,
    isActive: true,
    campaignId: campaigns[0]._id,
  })
  console.log('Cupom BEMVINDO10 criado')

  // 9. Eventos e pedidos simulados
  const sessionIds = ['sess_001', 'sess_002', 'sess_003']
  const eventDocs = []
  for (let i = 0; i < 50; i++) {
    const product = products[Math.floor(Math.random() * products.length)]
    const types = ['view', 'view', 'view', 'add_to_cart', 'checkout_initiated'] as const
    const type = types[Math.floor(Math.random() * types.length)]
    const sessionId = sessionIds[Math.floor(Math.random() * sessionIds.length)]
    const daysAgo = Math.floor(Math.random() * 30)
    const eventDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    eventDocs.push({
      storeId: store._id,
      productId: product._id,
      type,
      sessionId,
      userId: Math.random() > 0.5 ? customers[0]._id : undefined,
      utmCampaign: Math.random() > 0.7 ? 'junho-2026' : undefined,
      createdAt: eventDate,
    })
  }
  await Event.insertMany(eventDocs)

  // 10. Pedidos simulados
  const orderDocs = []
  for (let i = 0; i < 20; i++) {
    const product = products[Math.floor(Math.random() * products.length)]
    const quantity = Math.floor(Math.random() * 3) + 1
    const total = (product.promoPrice ?? product.price) * quantity
    const daysAgo = Math.floor(Math.random() * 30)
    const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    orderDocs.push({
      storeId: store._id,
      userId: customers[i % customers.length]._id,
      items: [{ productId: product._id, name: product.name, price: product.promoPrice ?? product.price, quantity }],
      subtotal: total,
      discountAmount: 0,
      total,
      status: 'initiated_whatsapp',
      whatsappUrl: 'https://wa.me/5511999998888?text=teste',
      utmCampaign: i % 3 === 0 ? 'junho-2026' : undefined,
      createdAt: orderDate,
    })
  }
  await Order.insertMany(orderDocs)

  console.log(`${eventDocs.length} eventos e ${orderDocs.length} pedidos simulados criados`)
  console.log('\nSeed concluído com sucesso!')
  console.log('\nCredenciais de acesso:')
  console.log('  Admin:    CPF 111.444.777-35 / Admin@123')
  console.log('  Cliente:  CPF — (clientes sem CPF no seed, use o cadastro)')
  console.log(`\nDEFAULT_STORE_ID=${store._id}`)

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Erro no seed:', err)
  process.exit(1)
})
