'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/update-password')
  }, [router])

  return null
}
