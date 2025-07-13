import { SignUpForm } from '@/components/sign-up-form'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { redirect } from 'next/navigation'

export default async function Page() {
  // Check if user is already authenticated
  const user = await getCurrentUser()

  if (user) {
    // Redirect authenticated users to the main app
    redirect('/new')
  }

  return <SignUpForm />
}
