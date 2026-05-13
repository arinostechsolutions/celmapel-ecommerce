import { z } from 'zod'

export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return false
  if (/^(\d)\1+$/.test(clean)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(clean[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(clean[10])
}

export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '')
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

// Schemas Zod reutilizáveis
export const cpfSchema = z
  .string()
  .min(11, 'CPF deve ter 11 dígitos')
  .refine((val) => validateCPF(val), { message: 'CPF inválido' })

export const phoneSchema = z
  .string()
  .regex(/^\(?\d{2}\)?[\s-]?[\d]{4,5}[\s-]?\d{4}$/, 'Telefone inválido (formato BR)')

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
  .regex(/[0-9]/, 'Deve conter ao menos um número')

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido')

export const mongoIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'ID inválido')

export const urlSchema = z
  .string()
  .url('URL inválida')
  .optional()
  .or(z.literal(''))
