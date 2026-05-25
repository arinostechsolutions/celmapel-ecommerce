import { Pool } from 'pg';

if (!process.env.PG_HOST) {
  throw new Error('PG_HOST não definido. Verifique o .env.local e conecte à VPN.');
}

const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

export default pool;
