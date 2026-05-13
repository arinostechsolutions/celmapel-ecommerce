/**
 * Script pontual: adiciona CPF ao usuário admin já existente no banco.
 * Execute uma única vez: npx tsx scripts/set-admin-cpf.ts
 */
import * as dotenv from 'dotenv'
import * as path from 'path'
import mongoose from 'mongoose'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const ADMIN_EMAIL = 'admin@celmapel.com.br'
const ADMIN_CPF   = '11144477735' // CPF de teste válido: 111.444.777-35

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI não definida em .env.local')

  await mongoose.connect(uri)
  console.log('Conectado ao MongoDB')

  const result = await mongoose.connection.collection('users').updateOne(
    { email: ADMIN_EMAIL },
    { $set: { cpf: ADMIN_CPF } }
  )

  if (result.matchedCount === 0) {
    console.error(`Nenhum usuário encontrado com email: ${ADMIN_EMAIL}`)
    console.error('Execute npm run seed primeiro.')
  } else {
    console.log(`✓ CPF ${ADMIN_CPF} definido para ${ADMIN_EMAIL}`)
    console.log('\nAcesso ao dashboard:')
    console.log('  CPF:   111.444.777-35')
    console.log('  Senha: Admin@123')
  }

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
