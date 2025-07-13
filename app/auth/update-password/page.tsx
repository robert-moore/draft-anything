import { redirect } from 'next/navigation'

export default function Page() {
  // Since we use magic links, redirect to login page
  redirect('/auth/login')
}
