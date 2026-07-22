import { redirect } from 'next/navigation'

export const metadata = {
  title: 'George – registrácia – Slovenská sporiteľňa, a.s.',
  description: 'Zaregistrujte sa do nového Internetbankingu Slovenskej sporiteľne.',
}

export default async function SignUpPage() {
  redirect('/dashboard2')
}