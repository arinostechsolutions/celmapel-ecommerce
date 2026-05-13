export const dynamic = 'force-dynamic'

import Link from 'next/link'
import connectDB from '@/lib/db/mongoose'
import User from '@/lib/db/models/user'
import { formatDate } from '@/lib/utils'
import { Users, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string }>
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const { page: pageParam, q } = await searchParams
  const page    = Math.max(1, parseInt(pageParam ?? '1', 10))
  const skip    = (page - 1) * PAGE_SIZE
  const search  = q?.trim() ?? ''

  let customers: {
    _id: unknown; name: string; email?: string; phone?: string;
    cpf?: string; isBlocked?: boolean; createdAt: unknown
  }[] = []
  let total = 0

  try {
    await connectDB()

    const filter: Record<string, unknown> = { role: 'customer', isDeleted: false }
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    ;[customers, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .select('name email phone cpf isBlocked createdAt')
        .lean() as Promise<typeof customers>,
      User.countDocuments(filter),
    ])
  } catch { /* sem banco configurado */ }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    params.set('page', String(p))
    return `/dashboard/clientes?${params}`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} cliente{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>

        {/* Busca */}
        <form method="GET" className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 w-64"
          />
          <button
            type="submit"
            className="h-9 px-4 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">CPF</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Cadastro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {search ? `Nenhum cliente encontrado para "${search}"` : 'Nenhum cliente cadastrado ainda'}
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={String(c._id)} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{c.name}</p>
                      {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell font-mono text-xs">
                    {c.cpf
                      ? `***.***.${ c.cpf.slice(6,9)}-**`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatDate(c.createdAt as string)}</td>
                  <td className="px-4 py-3">
                    {c.isBlocked ? (
                      <Badge variant="danger" className="gap-1">
                        <UserX className="w-3 h-3" />
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge variant="success" className="gap-1">
                        <UserCheck className="w-3 h-3" />
                        Ativo
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Página {page} de {totalPages} · {total} clientes
            </p>
            <div className="flex items-center gap-1">
              {page > 1 ? (
                <Link href={buildUrl(page - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </Link>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </span>
              )}

              {/* Páginas ao redor da atual */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">…</span>
                  ) : (
                    <Link
                      key={p}
                      href={buildUrl(p as number)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        p === page
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}

              {page < totalPages ? (
                <Link href={buildUrl(page + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  Próxima
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 cursor-not-allowed">
                  Próxima
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
