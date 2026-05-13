import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4 px-6 text-center">
      <h1 className="text-5xl font-bold text-gray-900">404</h1>
      <h2 className="text-lg font-semibold text-gray-800">Página não encontrada</h2>
      <p className="text-sm text-gray-500 max-w-md">
        A página que você procura não existe ou foi removida.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
      >
        Voltar à loja
      </Link>
    </div>
  )
}
