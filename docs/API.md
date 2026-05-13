# API Reference — Selmapel E-commerce

> Base URL (desenvolvimento): `http://localhost:3000/api`  
> Todas as respostas seguem o envelope JSON abaixo.

## Envelope de resposta

```jsonc
// Sucesso
{ "data": { ... } }

// Erro
{ "error": { "code": "BAD_REQUEST", "message": "Texto legível", "details": { ... } } }
```

**Códigos de erro comuns**

| `code` | HTTP | Descrição |
|--------|------|-----------|
| `BAD_REQUEST` | 400 | Corpo inválido ou campos faltando |
| `UNAUTHORIZED` | 401 | Token ausente ou expirado |
| `FORBIDDEN` | 403 | Role insuficiente |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `CONFLICT` | 409 | Recurso já existe (ex.: CPF duplicado) |
| `INTERNAL_ERROR` | 500 | Erro interno |

---

## Autenticação

A API usa **JWT** (Bearer token). O `access_token` é enviado via **cookie HttpOnly** (`access_token`) ou header `Authorization: Bearer <token>`.

- **Validade do access token**: 2 horas  
- **Validade do refresh token**: 7 dias  
- **Roles**: `customer` · `owner` · `manager` · `viewer`

---

## Módulos

- [Auth](#auth)
- [Produtos](#produtos)
- [Categorias](#categorias)
- [Banners](#banners)
- [Pedidos (WhatsApp)](#pedidos)
- [Campanhas](#campanhas)
- [Analytics / Eventos](#analytics--eventos)
- [Upload (Cloudinary)](#upload--cloudinary)
- [Configurações da loja](#configurações-da-loja)
- [Sincronização de estoque](#sincronização-de-estoque)

---

## Auth

### `POST /auth/register`

Cria uma nova conta de cliente.

**Corpo**
```jsonc
{
  "name": "João Silva",
  "cpf": "11144477735",          // CPF válido, apenas dígitos ou formatado
  "email": "joao@exemplo.com",   // opcional
  "phone": "11999998888",        // opcional, apenas dígitos
  "password": "Senha@123"        // mín. 8 chars, 1 maiúscula, 1 número, 1 especial
}
```

**Resposta 201**
```jsonc
{
  "data": {
    "accessToken": "<jwt>",
    "user": { "id": "...", "name": "João Silva", "role": "customer" }
  }
}
```

---

### `POST /auth/login`

Autentica com CPF + senha.

**Corpo**
```jsonc
{
  "cpf": "11144477735",
  "password": "Senha@123"
}
```

**Resposta 200**
```jsonc
{
  "data": {
    "accessToken": "<jwt>",
    "user": { "id": "...", "name": "João Silva", "role": "customer" }
  }
}
```

> O `access_token` também é definido como cookie HttpOnly. O `refresh_token` é sempre cookie.

---

### `POST /auth/refresh`

Renova o `access_token` usando o `refresh_token` (cookie).

**Corpo**: vazio  
**Resposta 200**: igual ao login

---

### `POST /auth/logout`

Invalida o refresh token e limpa os cookies.

**Auth**: obrigatória  
**Resposta 200**: `{ "data": { "ok": true } }`

---

### `GET /auth/me`

Retorna o perfil do usuário autenticado.

**Auth**: obrigatória  
**Resposta 200**
```jsonc
{
  "data": {
    "_id": "...",
    "name": "João Silva",
    "cpf": "111.444.777-35",
    "email": "joao@exemplo.com",
    "phone": "11999998888",
    "role": "customer"
  }
}
```

---

### `POST /auth/change-password`

Altera a senha do usuário autenticado. Invalida todos os refresh tokens existentes.

**Auth**: obrigatória  
**Corpo**
```jsonc
{
  "currentPassword": "Senha@123",
  "newPassword": "NovaSenha@456"
}
```

**Resposta 200**: `{ "data": { "ok": true } }`

---

## Produtos

### `GET /products`

Lista produtos com filtros e paginação.

**Auth**: não necessária (leitura pública)  
**Query params**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `q` | string | — | Busca textual (usa índice `$text` do MongoDB) |
| `categoryId` | string | — | Filtra por categoria (ObjectId) |
| `status` | `published` \| `draft` \| `inactive` | `published` | — |
| `page` | number | `1` | Página atual |
| `limit` | number | `24` | Itens por página (máx. 48) |
| `sort` | `createdAt` \| `price_asc` \| `price_desc` \| `orderCount` \| `viewCount` | `createdAt` | Ordenação |

**Resposta 200**
```jsonc
{
  "data": {
    "products": [ { "_id": "...", "name": "...", "price": 12.90, ... } ],
    "total": 120,
    "page": 1,
    "pages": 5
  }
}
```

---

### `POST /products`

Cria um produto. **Auth**: dashboard (`owner` ou `manager`)

**Corpo**
```jsonc
{
  "name": "Bala de Coco 500g",
  "description": "<p>Descrição HTML</p>",
  "price": 12.90,
  "promoPrice": 9.90,           // opcional
  "sku": "BAL-001",             // opcional
  "categoryId": "<ObjectId>",
  "tags": ["Promoção"],
  "variations": [               // opcional
    { "name": "Sabor", "options": ["Coco", "Morango"] }
  ],
  "status": "draft",            // published | draft | inactive
  "showOnSite": false,
  "isFeatured": false,
  "images": [
    { "url": "https://...", "publicId": "selmapel/products/...", "order": 0 }
  ]
}
```

**Resposta 201**: produto criado completo

---

### `GET /products/:id`

Busca produto por `_id` ou `slug`.

**Resposta 200**: produto com `categoryId` populado

---

### `PATCH /products/:id`

Atualiza campos parcialmente. **Auth**: dashboard  
Aceita qualquer subconjunto dos campos de criação.  
**Ao trocar `images`**: assets removidos são deletados automaticamente do Cloudinary.

**Resposta 200**: produto atualizado

---

### `DELETE /products/:id`

Soft-delete (marca `isDeleted: true`). **Auth**: dashboard  
Deleta imagens do Cloudinary automaticamente.

**Resposta 200**: `{ "data": { "message": "Produto removido" } }`

---

## Categorias

### `GET /categories`

Lista categorias visíveis.

**Query params**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `storeId` | string | Padrão: `DEFAULT_STORE_ID` |
| `showHidden` | `true` | Incluir categorias ocultas (requer auth) |

**Resposta 200**: `{ "data": [ { "_id": "...", "name": "Balas", "icon": "Candy", "order": 1 } ] }`

---

### `POST /categories`

Cria categoria. **Auth**: dashboard

**Corpo**
```jsonc
{
  "name": "Chocolates",
  "icon": "Chocolate",   // nome do ícone Lucide
  "order": 2,
  "isVisible": true
}
```

---

### `PATCH /categories/:id`

Atualiza categoria. **Auth**: dashboard

---

### `DELETE /categories/:id`

Soft-delete. **Auth**: dashboard

---

## Banners

### `GET /banners`

Lista banners ativos e dentro do período de vigência.

**Query params**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `storeId` | string | Padrão: `DEFAULT_STORE_ID` |

**Resposta 200**: array de banners

---

### `POST /banners`

Cria banner. **Auth**: dashboard

**Corpo**
```jsonc
{
  "title": "Promoção de Páscoa",
  "imageUrl": "https://res.cloudinary.com/...",
  "imagePublicId": "selmapel/banners/...",
  "linkUrl": "/busca?categoryId=...",  // URL relativa ou absoluta, opcional
  "startDate": "2026-03-01",
  "endDate": "2026-04-20",
  "order": 0
}
```

---

### `PATCH /banners/:id`

Atualiza banner. **Auth**: dashboard  
Ao trocar `imagePublicId`, o asset antigo é deletado do Cloudinary.

---

### `DELETE /banners/:id`

Remove banner e deleta imagem do Cloudinary. **Auth**: dashboard

---

## Pedidos

### `POST /orders`

Registra um pedido iniciado via WhatsApp. Gera e retorna a URL do WhatsApp com a mensagem pré-preenchida.

**Auth**: recomendada (funciona também anonimamente)

**Corpo**
```jsonc
{
  "clientItems": [
    { "productId": "<ObjectId>", "name": "Bala de Coco", "price": 12.90, "quantity": 2 }
  ],
  "couponCode": "PROMO10",     // opcional
  "discountAmount": 2.58,      // opcional
  "utmSource": "instagram",    // opcional — rastreamento UTM
  "utmMedium": "social",
  "utmCampaign": "pascoa-2026"
}
```

**Resposta 201**
```jsonc
{
  "data": {
    "orderId": "<ObjectId>",
    "whatsappUrl": "https://wa.me/5511999998888?text=Ol%C3%A1%21...",
    "total": 23.22
  }
}
```

---

## Campanhas

### `GET /campaigns`

Lista campanhas da loja. **Auth**: dashboard

**Resposta 200**: array com `name`, `utmSource`, `utmMedium`, `utmCampaign`, `clickCount`, `isActive`, `startDate`, `endDate`

---

### `POST /campaigns`

Cria campanha. **Auth**: dashboard

**Corpo**
```jsonc
{
  "name": "Black Friday Instagram",
  "description": "Campanha de novembro",
  "utmSource": "instagram",
  "utmMedium": "social",
  "utmCampaign": "black-friday-2026",
  "utmContent": "banner-principal",  // opcional
  "utmTerm": "doces-festa",          // opcional
  "startDate": "2026-11-25",
  "endDate": "2026-11-30",
  "isActive": true
}
```

**Resposta 201**: campanha criada  
O link rastreável gerado segue o padrão:
```
https://sualoja.com/?utm_source=instagram&utm_medium=social&utm_campaign=black-friday-2026
```

---

### `POST /campaigns/track`

Incrementa o `clickCount` de uma campanha. Chamado automaticamente pelo `UtmTracker` no frontend quando a página é acessada via link com UTM.

**Auth**: não necessária  
**Corpo**
```jsonc
{
  "utmCampaign": "black-friday-2026",
  "utmSource": "instagram",   // opcional
  "utmMedium": "social"       // opcional
}
```

**Resposta 200**: `{ "data": { "tracked": true } }`

---

## Analytics / Eventos

### `POST /analytics/events`

Registra um evento comportamental. Rate-limited.

**Auth**: opcional (registra `userId` se autenticado)

**Corpo**
```jsonc
{
  "productId": "<ObjectId>",
  "type": "view",              // view | add_to_cart | remove_from_cart | checkout_initiated
  "sessionId": "sess_abc123",  // ID de sessão gerado no cliente
  "utmSource": "instagram",    // opcional
  "utmMedium": "social",
  "utmCampaign": "pascoa-2026"
}
```

**Resposta 200**: `{ "data": { "tracked": true } }`

---

### `GET /analytics/metrics`

Retorna métricas agregadas para o dashboard. **Auth**: dashboard

**Query params**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `days` | number | `30` | Janela de tempo em dias |

**Resposta 200**
```jsonc
{
  "data": {
    "views": 1240,
    "cartAdds": 380,
    "checkouts": 95,
    "conversionRate": "7.7",
    "topViewed": [ { "name": "Bala de Coco 500g", "count": 142 } ],
    "topCheckout": [ { "name": "Chocolate Trufado", "count": 38 } ]
  }
}
```

---

## Upload / Cloudinary

### `POST /upload/sign`

Gera uma assinatura para upload direto ao Cloudinary. **Auth**: dashboard

**Corpo**
```jsonc
{
  "context": "product",                // product | banner | logo
  "fileType": "image/jpeg"             // image/jpeg | image/png | image/webp
}
```

**Resposta 200**
```jsonc
{
  "data": {
    "signature": "<sha256>",
    "timestamp": 1715000000,
    "apiKey": "...",
    "cloudName": "...",
    "folder": "selmapel/products"
  }
}
```

**Fluxo de upload direto**

```
1. POST /api/upload/sign  →  obtém { signature, timestamp, apiKey, cloudName, folder }
2. POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload  (com os dados da assinatura)
3. Usar secure_url e public_id retornados pelo Cloudinary
```

---

### `DELETE /upload/delete`

Remove um asset do Cloudinary. **Auth**: dashboard

**Corpo**
```jsonc
{ "publicId": "selmapel/products/abc123" }
```

**Resposta 200**: `{ "data": { "deleted": true } }`

---

## Configurações da loja

### `GET /settings`

Retorna configurações da loja. **Auth**: dashboard

**Resposta 200**
```jsonc
{
  "data": {
    "_id": "...",
    "name": "Selmapel Festas",
    "primaryColor": "#9333ea",
    "whatsappPhone": "11999998888",
    "whatsappDDI": "55",
    "whatsappTemplate": "Olá! Gostaria de fazer o pedido:\n\n{itens}\n\n{cupom}*Total: {total}*",
    "address": "Rua Exemplo, 123",
    "businessHours": [
      { "day": 1, "open": "09:00", "close": "18:00", "closed": false }
    ]
  }
}
```

---

### `PATCH /settings`

Atualiza configurações. **Auth**: `owner` ou `manager`

Aceita qualquer subconjunto dos campos abaixo:

| Campo | Tipo | Validação |
|-------|------|-----------|
| `name` | string | máx. 200 chars |
| `primaryColor` | string | HEX `#RRGGBB` |
| `whatsappPhone` | string | 8–11 dígitos |
| `whatsappDDI` | string | 1–4 dígitos (padrão: `55`) |
| `whatsappTemplate` | string | máx. 1000 chars. Variáveis: `{itens}` `{subtotal}` `{total}` `{cupom}` |
| `address` | string | máx. 300 chars |
| `businessHours` | array | `[{ day: 0-6, open: "HH:MM", close: "HH:MM", closed: bool }]` |

---

## Sincronização de estoque

### `POST /sync/inventory`

Sincroniza produtos/estoque de um sistema externo via payload JSON. **Auth**: dashboard (`owner`)

**Corpo**
```jsonc
{
  "products": [
    {
      "externalId": "SKU-001",
      "name": "Bala de Coco 500g",
      "price": 12.90,
      "stock": 150,
      "categoryName": "Balas"
    }
  ],
  "source": "postgres"   // identificador da origem
}
```

**Resposta 200**
```jsonc
{
  "data": {
    "upserted": 12,
    "skipped": 0,
    "errors": []
  }
}
```

---

## Rate limiting

| Grupo | Limite | Janela |
|-------|--------|--------|
| `api` (geral) | 100 req | 60 s |
| `auth` (login/register) | 10 req | 60 s |
| `track` (eventos) | 200 req | 60 s |

Quando o limite é atingido a API retorna `429 Too Many Requests`.  
Rate limiting requer **Upstash Redis** configurado. Em desenvolvimento, sem as variáveis `UPSTASH_*`, é desabilitado automaticamente.

---

## Variáveis de ambiente

```dotenv
# App
NEXT_PUBLIC_APP_URL=https://sualoja.com

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=<string longa e aleatória, mín. 32 chars>
JWT_REFRESH_SECRET=<outra string longa e aleatória>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# Upstash Redis (opcional — desabilita rate limiting se ausente)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

# ID da loja no MongoDB (obtido após npm run seed)
DEFAULT_STORE_ID=<ObjectId>
```

---

## Scripts úteis

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Popular banco com dados de exemplo
npm run seed

# Atribuir CPF ao admin existente (se necessário)
npx tsx scripts/set-admin-cpf.ts

# Build de produção
npm run build && npm start
```

**Credenciais padrão do dashboard** (após seed):

| Campo | Valor |
|-------|-------|
| CPF | `111.444.777-35` |
| Senha | `Admin@123` |

---

## Modelos de dados

### Product
```typescript
{
  _id: ObjectId
  storeId: ObjectId
  name: string                    // máx. 200 chars
  slug: string                    // gerado automaticamente
  description: string             // HTML sanitizado
  price: number                   // em reais
  promoPrice?: number
  sku?: string
  categoryId: ObjectId
  tags: string[]
  variations: { name: string; options: string[] }[]
  status: 'published' | 'draft' | 'inactive'
  showOnSite: boolean
  isFeatured: boolean
  images: { url: string; publicId: string; alt?: string; order: number }[]
  orderCount: number              // incrementado a cada pedido
  viewCount: number               // incrementado via evento
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Order
```typescript
{
  _id: ObjectId
  storeId: ObjectId
  userId?: ObjectId               // ausente se anônimo
  items: { productId: ObjectId; name: string; price: number; quantity: number; imageUrl?: string }[]
  subtotal: number
  discountAmount: number
  total: number
  couponId?: ObjectId
  status: 'initiated_whatsapp'
  whatsappUrl: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  createdAt: Date
}
```

### Campaign
```typescript
{
  _id: ObjectId
  storeId: ObjectId
  name: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent?: string
  utmTerm?: string
  clickCount: number              // incrementado via POST /campaigns/track
  isActive: boolean
  startDate: Date
  endDate: Date
  createdAt: Date
}
```

### Event (Analytics)
```typescript
{
  _id: ObjectId
  storeId: ObjectId | string
  productId: ObjectId
  userId?: ObjectId
  sessionId: string
  type: 'view' | 'add_to_cart' | 'remove_from_cart' | 'checkout_initiated'
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  createdAt: Date
}
```
