/** Chaves de permissão granular — correspondem às features do dashboard */
export const PERM = {
  PRODUCTS:    'produtos',
  CATEGORIES:  'categorias',
  BANNERS:     'banners',
  CAMPAIGNS:   'campanhas',
  CUSTOMERS:   'clientes',
  REPORTS:     'relatorio',
  PROMOTIONS:  'promocoes',
  LOGS:        'logs',
  SETTINGS:    'configuracoes',
} as const

export type Permission = typeof PERM[keyof typeof PERM]

export const ALL_PERMISSIONS: Permission[] = Object.values(PERM)

/** Roles que têm acesso irrestrito — ignoram a lista de permissions */
export const UNRESTRICTED_ROLES = ['master', 'owner']

/** Verifica se o usuário tem uma permissão (ou é master/owner) */
export function hasPermission(role: string, permissions: string[], perm: Permission): boolean {
  if (UNRESTRICTED_ROLES.includes(role)) return true
  return permissions.includes(perm)
}

export const PERM_LABELS: Record<Permission, string> = {
  produtos:      'Produtos',
  categorias:    'Categorias',
  banners:       'Banners',
  campanhas:     'Campanhas',
  clientes:      'Clientes',
  relatorio:     'Relatório',
  promocoes:     'Promoções',
  logs:          'Logs',
  configuracoes: 'Configurações',
}
