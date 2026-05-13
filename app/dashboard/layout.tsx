import { DashboardShell } from '@/components/dashboard/dashboard-shell'

// Evita prerender estático em todo o /dashboard. Páginas client com useForm
// quebram no prerender do Railway (useContext null em workers paralelos).
export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
