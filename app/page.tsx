import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const cookieStore = await cookies()
  const hasSession = cookieStore.get('sb-access-token')

  if (hasSession) {
    redirect('/dashboard')
  } else {
    redirect('/auth/login')
  }
}
