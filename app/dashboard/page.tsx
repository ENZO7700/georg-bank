import { redirect } from 'next/navigation'

/**
 * Legacy /dashboard shell — permanently redirected to /dashboard2.
 * Keep the route so old bookmarks / menu links still resolve.
 */
export default function DashboardPage() {
  redirect('/dashboard2')
}
