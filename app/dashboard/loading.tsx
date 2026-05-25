export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Cabeçalho da página */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-72 bg-gray-100 rounded-lg" />
      </div>

      {/* Barra de ações (botão + filtro) */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-9 w-64 bg-gray-100 rounded-xl" />
        <div className="h-9 w-36 bg-gray-200 rounded-xl" />
      </div>

      {/* Linhas da tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header da tabela */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-100 rounded ml-auto" />
          <div className="h-4 w-20 bg-gray-100 rounded" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>

        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-200 rounded w-2/5" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100" />
              <div className="w-8 h-8 rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
