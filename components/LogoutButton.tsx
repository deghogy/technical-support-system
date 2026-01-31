'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/contexts/AuthProvider'

export default function LogoutButton() {
  const router = useRouter()
  const { signOut } = useAuth()

  async function logout() {
    await signOut()
    router.push('/login')
  }

  return (
    <button className="logout-button" onClick={logout}>
      Logout
    </button>
  )
}