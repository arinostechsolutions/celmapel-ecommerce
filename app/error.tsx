'use client'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4 px-6 text-center">
      <h2 className="text-xl font-bold text-gray-900">Algo deu errado</h2>
      <p className="text-sm text-gray-500 max-w-md">
        Encontramos um problema ao carregar esta página.
      </p>
      {error.digest && (
        <code className="text-xs text-gray-400">ID: {error.digest}</code>
      )}
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
