'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
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
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>
            Algo deu errado
          </h1>
          <p style={{ fontSize: 14, color: '#666', textAlign: 'center', maxWidth: 480 }}>
            Um erro inesperado ocorreu. Tente recarregar a página.
          </p>
          {error.digest && (
            <code style={{ fontSize: 12, color: '#999' }}>ID: {error.digest}</code>
          )}
          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
