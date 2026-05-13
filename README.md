# Celmapel Festas — E-commerce + Dashboard

Plataforma de e-commerce WhatsApp Commerce com painel administrativo completo.

## Stack

- **Next.js 15** (App Router, Server Components, ISR)
- **TypeScript** (strict mode)
- **MongoDB** (Mongoose, índices compostos)
- **Redis** (Upstash — cache, rate limiting, sessões)
- **Tailwind CSS** com design system via CSS Variables
- **Zustand** (estado do carrinho, persistência localStorage)
- **Cloudinary** (upload seguro via assinatura server-side)
- **JWT + Refresh Token rotativo** (HttpOnly cookies)
- **Lucide Icons**

## Arquitetura

```
app/
├── (store)/           # E-commerce público (cliente final)
│   ├── page.tsx       # Home: banners, destaques, mais vendidos, promoções
│   ├── produto/[slug] # Detalhe do produto + galeria + variações
│   ├── categoria/[slug]
│   ├── busca/         # Busca com filtros (categoria, preço, ordenação)
│   ├── carrinho/
│   └── auth/          # Login, cadastro, recuperação de senha
│
└── dashboard/         # Painel administrativo
    ├── page.tsx       # Overview: KPIs, gráficos, últimos pedidos
    ├── produtos/      # CRUD completo de produtos
    ├── categorias/    # Gestão de categorias com ícones Lucide
    ├── banners/       # Banners rotativos por período
    ├── campanhas/     # Campanhas UTM + geração de QR Code
    ├── clientes/      # Listagem de clientes cadastrados
    └── configuracoes/ # Dados da loja, WhatsApp, sincronização

lib/
├── db/models/         # Schemas Mongoose (User, Store, Product, ...)
├── auth/              # JWT, bcrypt, password helpers
├── cache/             # Redis client (Upstash) + CACHE_KEYS
├── security/          # Rate limiting, sanitização, validação CPF
├── cloudinary/        # Geração de assinatura + delete de assets
├── analytics/         # Tracking de eventos (view, add_to_cart, ...)
└── sync/              # Serviço de sincronização com API externa
```

## Setup Local

### 1. Clonar e instalar dependências

```bash
git clone ...
cd selmapel-ecommerce
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com:

| Variável | Descrição |
|---|---|
| `MONGODB_URI` | Connection string do MongoDB |
| `UPSTASH_REDIS_REST_URL` | URL do Redis Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Token do Redis Upstash |
| `JWT_SECRET` | Secret para access tokens (≥32 chars) |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens (≥32 chars) |
| `CLOUDINARY_CLOUD_NAME` | Nome da conta Cloudinary |
| `CLOUDINARY_API_KEY` | API Key do Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret do Cloudinary (nunca exposta ao cliente) |
| `DEFAULT_STORE_ID` | ObjectId da loja no MongoDB (obtido após seed) |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação |

### 3. Executar o seed

```bash
npm run seed
```

O seed cria:
- 1 loja (Celmapel Festas)
- 5 categorias
- 30+ produtos com imagens placeholder
- 2 banners ativos
- 3 campanhas UTM
- 5 clientes de exemplo
- Eventos e pedidos simulados para popular os gráficos

**Após o seed**, copie o `DEFAULT_STORE_ID` impresso no terminal para `.env.local`.

### 4. Iniciar em desenvolvimento

```bash
npm run dev
```

**Acesso:**
- Loja: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard/login
  - Email: `admin@celmapel.com.br`
  - Senha: `Admin@123`

## Fluxo de Pedido via WhatsApp

1. Cliente adiciona produtos ao carrinho (Zustand + localStorage)
2. Aplica cupom (validação server-side)
3. Clica em "Finalizar pelo WhatsApp"
4. API `/api/orders` gera a mensagem formatada
5. Redireciona para `wa.me/{telefone}?text={mensagem_codificada}`
6. Pedido registrado no MongoDB com status `initiated_whatsapp`
7. UTM params propagados para atribuição de campanha

## Upload de Imagens (Cloudinary)

O fluxo de upload é 100% seguro:

1. **Cliente** solicita assinatura em `/api/upload/sign` (requer autenticação)
2. **Server** valida autenticação + tipo de arquivo e gera `signature` com `CLOUDINARY_API_SECRET`
3. **Cliente** envia o arquivo diretamente ao Cloudinary usando a assinatura
4. **Cloudinary** retorna `url` e `public_id`
5. **Cliente** persiste apenas a URL e o public_id no MongoDB via API

`CLOUDINARY_API_SECRET` nunca trafega para o cliente.

## Segurança

- JWT 15min + Refresh Token 7d (rotativo, HttpOnly cookie)
- Rate limiting por IP/usuário via Upstash Ratelimit:
  - Auth: 5 req/min
  - Busca: 30 req/min
  - Tracking: 60 req/min
  - Dashboard: 100 req/min
- Bloqueio automático após 5 tentativas de login (15 min)
- RBAC server-side (owner, manager, viewer, customer)
- Sanitização HTML via DOMPurify (server-side)
- Validação de inputs via Zod em todos os endpoints
- LGPD: `DELETE /api/user/me` anonimiza dados pessoais

## Sincronização com API Externa

Configure as variáveis `EXTERNAL_INVENTORY_API_URL` e `EXTERNAL_INVENTORY_API_KEY`.

Disparo:
- Manual via Dashboard > Configurações > Sincronizar Agora
- Via `POST /api/sync/inventory` (autenticado, role: owner)

O serviço aplica upsert inteligente (cria, atualiza, desativa) com backoff exponencial e log detalhado em `/lib/db/models/sync-log.ts`.

## Deploy

### Vercel (recomendado)

```bash
vercel deploy
```

Configure todas as variáveis de ambiente na dashboard da Vercel.

### Checklist pré-deploy

- [ ] `NODE_ENV=production`
- [ ] HTTPS configurado
- [ ] Variáveis de ambiente sem `NEXT_PUBLIC_` para secrets
- [ ] MongoDB Atlas com IP whitelist
- [ ] Cloudinary signed upload preset
- [ ] Redis Upstash configurado

## Scripts

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run start      # Iniciar build de produção
npm run seed       # Popular banco com dados de exemplo
npm run typecheck  # Verificar tipos TypeScript
npm run lint       # ESLint
```
