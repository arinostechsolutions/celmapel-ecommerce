import { NoSSR } from '@/components/ui/no-ssr'
import RegisterForm from './register-form'

export default function RegisterPage() {
  return (
    <NoSSR>
      <RegisterForm />
    </NoSSR>
  )
}
