import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 })
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    { error: { code: 'BAD_REQUEST', message, ...(details ? { details } : {}) } },
    { status: 400 }
  )
}

export function unauthorized(message = 'Não autenticado'): NextResponse {
  return NextResponse.json(
    { error: { code: 'UNAUTHORIZED', message } },
    { status: 401 }
  )
}

export function forbidden(message = 'Acesso não permitido'): NextResponse {
  return NextResponse.json(
    { error: { code: 'FORBIDDEN', message } },
    { status: 403 }
  )
}

export function notFound(message = 'Recurso não encontrado'): NextResponse {
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message } },
    { status: 404 }
  )
}

export function conflict(message: string): NextResponse {
  return NextResponse.json(
    { error: { code: 'CONFLICT', message } },
    { status: 409 }
  )
}

export function internalError(err?: unknown): NextResponse {
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error]', err)
  }
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } },
    { status: 500 }
  )
}

export function validationError(errors: Record<string, string[]>): NextResponse {
  return NextResponse.json(
    { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', details: errors } },
    { status: 422 }
  )
}
