import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

function safeAppUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const fallback = 'http://localhost:3000'
  if (!raw) return new URL(fallback)
  try {
    return new URL(raw)
  } catch {
    // Variável mal-configurada (ex.: contém "NOME=valor"). Faz fallback
    // em vez de quebrar o build inteiro.
    console.warn(`[layout] NEXT_PUBLIC_APP_URL inválida: "${raw}". Usando fallback.`)
    return new URL(fallback)
  }
}

export const metadata: Metadata = {
  title: {
    template: '%s | Celmapel Festas',
    default: 'Celmapel Festas — Tudo para sua festa',
  },
  description:
    'A melhor loja de artigos para festas, balas, chocolates e doces. Qualidade e variedade em um só lugar.',
  metadataBase: safeAppUrl(),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
