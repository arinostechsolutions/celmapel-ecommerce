import { NextRequest } from 'next/server'
import pool from '@/lib/db/postgres'
import { ok, unauthorized, forbidden, internalError } from '@/lib/api/response'
import { requireAuth, requireDashboardAccess } from '@/lib/api/auth-guard'

export async function GET(req: NextRequest) {
  try {
    let payload
    try {
      payload = requireAuth(req)
      requireDashboardAccess(payload)
    } catch (e) {
      return (e as Error).message === 'FORBIDDEN' ? forbidden() : unauthorized()
    }

    const { searchParams } = new URL(req.url)
    const dias   = Math.min(parseInt(searchParams.get('dias') ?? '7'), 90)
    const limite = Math.min(parseInt(searchParams.get('limite') ?? '20'), 50)
    const lojaId = parseInt(searchParams.get('loja') ?? '1')

    const { rows } = await pool.query<{
      codigo: number
      produto: string
      total_vendido: number
      valor_total: string
    }>(
      `SELECT
         p.id                        AS codigo,
         p.descricaocompleta         AS produto,
         SUM(v.quantidade)::integer  AS total_vendido,
         SUM(v.valortotal)::numeric(12,2) AS valor_total
       FROM venda v
       JOIN produto p ON v.id_produto = p.id
       WHERE v.data >= CURRENT_DATE - ($1 || ' days')::interval
         AND v.id_loja = $2
       GROUP BY p.id, p.descricaocompleta
       ORDER BY total_vendido DESC
       LIMIT $3`,
      [dias, lojaId, limite]
    )

    return ok({ produtos: rows, dias, loja: lojaId })
  } catch (err) {
    return internalError(err)
  }
}
