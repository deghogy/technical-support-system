'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/contexts/AuthProvider'

export default function LogoutButton() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function logout() {
    setIsLoggingOut(true)
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      className="logout-button"
      onClick={logout}
      disabled={isLoggingOut}
      style={{ opacity: isLoggingOut ? 0.7 : 1 }}
    >
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>
  )
}