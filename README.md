# Selmapel E-commerce

Plataforma de e-commerce com checkout via WhatsApp, dashboard administrativo e analytics comportamental. Construída com Next.js 15, MongoDB, Cloudinary e JWT.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router, Server Components) |
| Linguagem | TypeScript (strict) |
| Banco de dados | MongoDB Atlas + Mongoose |
| Cache / Rate limit | Upstash Redis |
| Autenticação | JWT (access 2h + refresh 7d) via `jsonwebtoken` / `jose` |
| Imagens | Cloudinary (upload direto assinado) |
| Estilização | Tailwind CSS v4 |
| Estado (carrinho) | Zustand |
| Formulários | react-hook-form + Zod |
| Animações | Framer Motion |
| Gráficos | Recharts |

---

## Estrutura de pastas

```
app/
  (store)/          → Storefront público (loja, produto, perfil)
  (auth)/           → Páginas de login e cadastro (layout mínimo)
  dashboard/        → Painel administrativo (protegido por JWT)
  api/              → Rotas de API REST

components/
  store/            → Componentes da loja (header, cart, product-card…)
  dashboard/        → Componentes do painel
  ui/               → Componentes genéricos (Button, Input, ImageUploader…)

lib/
  db/               → Conexão MongoDB + modelos Mongoose
  auth/             → JWT helpers
  api/              → Guards de autenticação, helpers de resposta
  cloudinary/       → Geração de assinatura para upload
  analytics/        → Tracker de eventos comportamentais
  security/         → Rate limiting, sanitização HTML

hooks/
  use-cart.ts       → Zustand store do carrinho

scripts/
  seed.ts           → Popula o banco com dados de exemplo
```

---

## Início rápido

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/selmapel-dev

JWT_SECRET=<string aleatória >= 32 chars>
JWT_REFRESH_SECRET=<outra string aleatória>

CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# Opcional — rate limiting (desabilitado sem estas variáveis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Preenchido automaticamente após o seed
DEFAULT_STORE_ID=
```

### 3. Popular o banco

```bash
npm run seed
```

Copie o `DEFAULT_STORE_ID` exibido no terminal e adicione ao `.env.local`. Reinicie o servidor.

### 4. Iniciar em desenvolvimento

```bash
npm run dev
```

- **Loja**: http://localhost:3000  
- **Dashboard**: http://localhost:3000/dashboard/login  
  - CPF: `111.444.777-35` · Senha: `Admin@123`

---

## Funcionalidades

### Storefront
- Catálogo de produtos com filtros por categoria, preço e ordenação
- Barra de categorias horizontal com chips animados
- Painel de filtros (bottom sheet mobile / drawer desktop)
- Cards de produto responsivos com lightbox de imagem
- Página de detalhe com galeria, variações e compartilhamento
- Carrinho persistente com mini-cart dropdown
- Checkout via WhatsApp com mensagem pré-formatada
- Cupons de desconto
- Autenticação por CPF com perfil e troca de senha
- Rastreamento UTM automático de campanhas

### Dashboard
- Visão geral com KPIs, gráfico de atividade, funil de conversão
- Detalhes de pedidos com drawer animado
- Exportar relatório em PDF (`/dashboard/relatorio`)
- Gerenciamento de produtos (CRUD, upload de imagem, paginação, filtros)
- Gerenciamento de categorias e banners (com vinculação a categorias)
- Campanhas com geração de links UTM e tracking de cliques
- Lista de clientes paginada com busca
- Configurações da loja (cor primária, WhatsApp, horários)

---

## Autenticação

O sistema usa dois tokens:

| Token | Validade | Armazenamento |
|-------|----------|---------------|
| `access_token` | 2 horas | Cookie HttpOnly + memória |
| `refresh_token` | 7 dias | Cookie HttpOnly |

Refresh silencioso é feito automaticamente no header e na página de perfil. Roles disponíveis: `customer`, `owner`, `manager`, `viewer`.

---

## Upload de imagens

O upload é feito **diretamente para o Cloudinary** sem passar pelo servidor Next.js:

1. Frontend solicita assinatura: `POST /api/upload/sign`
2. Frontend envia o arquivo para `https://api.cloudinary.com/v1_1/{cloud}/image/upload`
3. Frontend usa `secure_url` e `public_id` retornados

Contextos e dimensões recomendadas:

| Contexto | Dimensão recomendada |
|----------|---------------------|
| `product` | 800 × 800 px |
| `banner` | 1200 × 400 px |
| `logo` | 400 × 120 px |

Ao substituir ou remover uma imagem via PATCH, o asset antigo é deletado automaticamente do Cloudinary.

---

## Analytics

Eventos registrados via `POST /api/analytics/events`:

| Tipo | Disparado quando |
|------|-----------------|
| `view` | Página do produto é visitada |
| `add_to_cart` | Produto adicionado ao carrinho |
| `remove_from_cart` | Produto removido do carrinho |
| `checkout_initiated` | Usuário clica em "Finalizar compra" |

Os dados alimentam os gráficos de atividade, o funil de conversão e os rankings de produtos no dashboard.

---

## Integração com sistema externo (Postgres)

Para sincronizar produtos/estoque de um banco Postgres externo:

```bash
npm install pg drizzle-orm
```

Use `POST /api/sync/inventory` com o payload de produtos. A rota faz upsert no MongoDB mantendo imagens e dados adicionais já cadastrados.

Detalhes: [docs/API.md#sincronização-de-estoque](docs/API.md#sincronização-de-estoque)

---

## Documentação da API

Referência completa em [`docs/API.md`](docs/API.md).

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm start` | Inicia em produção |
| `npm run seed` | Popula banco com dados de exemplo |
| `npx tsx scripts/set-admin-cpf.ts` | Atribui CPF ao admin existente |

---

## Variáveis de ambiente — referência completa

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_APP_URL` | Sim | URL pública da aplicação |
| `MONGODB_URI` | Sim | String de conexão MongoDB |
| `JWT_SECRET` | Sim | Secret do access token |
| `JWT_REFRESH_SECRET` | Sim | Secret do refresh token |
| `CLOUDINARY_CLOUD_NAME` | Sim | Cloud name do Cloudinary |
| `CLOUDINARY_API_KEY` | Sim | API Key do Cloudinary |
| `CLOUDINARY_API_SECRET` | Sim | API Secret do Cloudinary |
| `DEFAULT_STORE_ID` | Sim | ObjectId da loja no MongoDB |
| `UPSTASH_REDIS_REST_URL` | Não | URL REST do Upstash (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Não | Token do Upstash |
