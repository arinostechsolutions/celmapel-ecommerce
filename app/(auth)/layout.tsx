import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header minimalista */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-sm mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
              Celmapel Festas
            </span>
          </Link>
        </div>
      </header>

      {/* Conteúdo centralizado */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Celmapel Festas
      </footer>
    </div>
  )
}
