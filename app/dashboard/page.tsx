'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, UserCheck, UserX, Ban, DollarSign, TrendingUp } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

interface Stats {
  totalUsers: number
  onlineUsers: number
  offlineUsers: number
  activeUsers: number
  rejectedUsers: number
  bannedUsers: number
  freeUsers: number
  paidUsers: number
  totalRevenue: number
}

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
}

export default function DashboardPage() {
  const { showToast } = useToast()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    onlineUsers: 0,
    offlineUsers: 0,
    activeUsers: 0,
    rejectedUsers: 0,
    bannedUsers: 0,
    freeUsers: 0,
    paidUsers: 0,
    totalRevenue: 0,
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching dashboard data from API...')
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showToast('error', 'Not authenticated')
        return
      }

      // Fetch users from server-side API (uses service role key, bypasses RLS)
      const usersRes = await fetch('/api/dashboard/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const usersData = await usersRes.json()
      
      if (!usersRes.ok) {
        console.error('❌ Error fetching users:', usersData.error)
        showToast('error', 'Failed to load users: ' + usersData.error)
        return
      }

      const users = usersData.users
      console.log('✅ Fetched users:', users?.length || 0)
      
      if (!users || users.length === 0) {
        showToast('warning', 'No users found in database')
      }

      // Fetch activity logs from API
      const activityRes = await fetch('/api/dashboard/activity', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const activityData = await activityRes.json()
      const activityLog = activityData.activities || []
      
      console.log('✅ Fetched activity logs:', activityLog.length)

      if (users && users.length > 0) {
        console.log('📊 Processing user stats...')
        const totalUsers = users.length
        const activeUsers = users.filter((u: any) => u.account_status === 'approved').length
        const rejectedUsers = users.filter((u: any) => u.account_status === 'rejected').length
        const bannedUsers = users.filter((u: any) => u.account_status === 'banned').length
        const freeUsers = users.filter((u: any) => u.account_mode === 'freemium').length
        const paidUsers = users.filter((u: any) => u.account_mode === 'premium').length
        const onlineUsers = users.filter((u: any) => u.online_status === 'online').length
        const offlineUsers = users.filter((u: any) => u.online_status === 'offline').length

        setStats({
          totalUsers,
          onlineUsers,
          offlineUsers,
          activeUsers,
          rejectedUsers,
          bannedUsers,
          freeUsers,
          paidUsers,
          totalRevenue: 0,
        })
        
        console.log('✅ Dashboard stats:', {
          totalUsers,
          onlineUsers,
          offlineUsers,
          activeUsers,
          rejectedUsers,
          bannedUsers,
          freeUsers,
          paidUsers,
        })
      }

      if (activityLog) {
        setActivities(activityLog.map((log: any) => {
          // Smart decode activity description
          let description = ''
          const activityType = log.activity_type || 'Unknown activity'
          const userName = log.user?.name || 'Unknown user'
          const userEmail = log.user?.email || ''
          
          if (log.metadata) {
            const meta = log.metadata
            if (meta.new_status && meta.old_status) {
              description = `${userName} - Status changed from ${meta.old_status} to ${meta.new_status}`
            } else if (meta.new_status) {
              description = `${userName} - Status set to ${meta.new_status}`
            } else {
              description = `${userName} - ${activityType}`
            }
          } else {
            // Use activity type as description if no metadata
            if (activityType === 'login') {
              description = `${userName} logged in`
            } else if (activityType === 'logout') {
              description = `${userName} logged out`
            } else {
              description = `${userName} - ${activityType}`
            }
          }

          return {
            id: log.id,
            type: activityType,
            description: description,
            timestamp: log.created_at,
            userId: log.user_id
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      showToast('error', 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Online Users', value: stats.onlineUsers, icon: UserCheck, color: 'bg-green-500' },
    { label: 'Offline Users', value: stats.offlineUsers, icon: UserX, color: 'bg-gray-500' },
    { label: 'Active Users', value: stats.activeUsers, icon: UserCheck, color: 'bg-emerald-500' },
    { label: 'Rejected Users', value: stats.rejectedUsers, icon: UserX, color: 'bg-orange-500' },
    { label: 'Banned Users', value: stats.bannedUsers, icon: Ban, color: 'bg-red-500' },
    { label: 'Free Users', value: stats.freeUsers, icon: Users, color: 'bg-purple-500' },
    { label: 'Paid Users', value: stats.paidUsers, icon: TrendingUp, color: 'bg-indigo-500' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-yellow-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Overview</h1>
        <p className="text-gray-600 mt-1">Welcome to Next Nukkad Team Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            activities.map((activity) => {
              // Get activity color based on type
              const getActivityColor = (type: string) => {
                if (type.includes('login')) return 'bg-green-50 border-green-200'
                if (type.includes('logout')) return 'bg-gray-50 border-gray-200'
                if (type.includes('account_status_change')) return 'bg-blue-50 border-blue-200'
                return 'bg-gray-50 border-gray-200'
              }

              const getActivityIcon = (type: string) => {
                if (type.includes('login')) return '🟢'
                if (type.includes('logout')) return '⚫'
                if (type.includes('approved')) return '✅'
                if (type.includes('rejected')) return '❌'
                if (type.includes('banned')) return '🚫'
                return '📝'
              }

              return (
                <div 
                  key={activity.id} 
                  className={`flex items-start gap-3 p-4 rounded-lg border ${getActivityColor(activity.type)}`}
                >
                  <div className="text-2xl flex-shrink-0">
                    {getActivityIcon(activity.description)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{activity.description}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(activity.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
