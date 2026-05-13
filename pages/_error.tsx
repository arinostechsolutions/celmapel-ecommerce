// Override do pages/_error padrão do Next.js 15.
// O default importa Html de next/document, inválido no App Router.
// Esta versão minimalista não tem essa importação.

import type { NextPageContext } from 'next'
import Link from 'next/link'

interface ErrorProps {
  statusCode?: number
}

function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        background: '#fafafa',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: 700, color: '#111', margin: 0 }}>
        {statusCode ?? 500}
      </h1>
      <p style={{ fontSize: 16, color: '#666', textAlign: 'center', maxWidth: 480 }}>
        {statusCode === 404
          ? 'Página não encontrada.'
          : 'Ocorreu um erro inesperado.'}
      </p>
      <Link
        href="/"
        style={{
          padding: '10px 20px',
          borderRadius: 8,
          background: '#7c3aed',
          color: '#fff',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Voltar à loja
      </Link>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404
  return { statusCode }
}

export default ErrorPage
