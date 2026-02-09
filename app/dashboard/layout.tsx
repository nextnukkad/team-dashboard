'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Users, CreditCard, AlertTriangle, FileText, Globe, LogOut, UserPlus, Settings, Bell } from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: Users, label: 'User Management', href: '/dashboard/users' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
  { icon: CreditCard, label: 'Transactions', href: '/dashboard/transactions' },
  { icon: AlertTriangle, label: 'Reports', href: '/dashboard/reports' },
  { icon: UserPlus, label: 'Early Access', href: '/dashboard/early-access' },
  { icon: FileText, label: 'Blogs', href: '/dashboard/blogs', badge: 'Soon' },
  { icon: Globe, label: 'Official Site', href: '/dashboard/site', badge: 'Soon' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings', badge: 'Soon' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
    }
    checkAuth()
  }, [])

  // Remove the problematic visibility change listeners
  // is_active stays true throughout the session

  const handleLogout = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (teamMember) {
        await supabase
          .from('team_members')
          .update({ is_active: false })
          .eq('id', teamMember.id)
      }
    }

    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-purple-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2 shadow-lg">
              <img src="/logo.png" alt="Next Nukkad" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Next Nukkad</h1>
              <p className="text-purple-200 text-xs">Team Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-purple-100 hover:bg-purple-700/50'
                }`}
              >
                <Icon size={20} />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge && (
                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-purple-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-purple-700/50 w-full transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-purple-50">
        {children}
      </main>
    </div>
  )
}
