'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, Ban, Flag } from 'lucide-react'

interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  reason: string
  status: string
  created_at: string
  reporter?: {
    name: string
    email: string
  }
  reported_user?: {
    name: string
    email: string
  }
}

interface BlockedUser {
  id: string
  user_id: string
  blocked_user_id: string
  reason: string
  created_at: string
  user?: {
    name: string
    email: string
  }
  blocked_user?: {
    name: string
    email: string
  }
}

interface ActivityLog {
  id: string
  user_id: string
  activity_type: string
  description: string
  timestamp: string
  user?: {
    name: string
    email: string
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [activeTab, setActiveTab] = useState<'reports' | 'blocked' | 'logs'>('reports')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session')
        setLoading(false)
        return
      }

      const response = await fetch('/api/dashboard/reports', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const { userReports, blockedUsers, activityLogs } = await response.json()
      if (userReports) setReports(userReports)
      if (blockedUsers) setBlockedUsers(blockedUsers)
      if (activityLogs) setActivityLogs(activityLogs)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reports & Activity</h1>
        <p className="text-gray-600 mt-1">Monitor user reports and banned accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Reports</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{reports.length}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <Flag size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Blocked Users</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{blockedUsers.length}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Ban size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Activity Logs</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{activityLogs.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <AlertTriangle size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'reports'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              User Reports
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'blocked'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Blocked Users
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'logs'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Activity Logs
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reports found</p>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag size={16} className="text-red-500" />
                          <span className="font-semibold text-gray-800">Report #{report.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{report.reporter?.name}</span> reported{' '}
                          <span className="font-medium">{report.reported_user?.name}</span>
                        </p>
                        <p className="text-sm text-gray-800 mb-2">
                          <span className="font-medium">Reason:</span> {report.reason}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'blocked' && (
            <div className="space-y-4">
              {blockedUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No blocked users found</p>
              ) : (
                blockedUsers.map((blocked) => (
                  <div key={blocked.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <Ban size={20} className="text-orange-500 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{blocked.user?.name}</span> blocked{' '}
                          <span className="font-medium">{blocked.blocked_user?.name}</span>
                        </p>
                        <p className="text-sm text-gray-800 mb-2">
                          <span className="font-medium">Reason:</span> {blocked.reason || 'No reason provided'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(blocked.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              {activityLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activity logs found</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-blue-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-800">{log.activity_type}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{log.description}</p>
                        {log.user && (
                          <p className="text-xs text-gray-500">
                            User: {log.user.name} ({log.user.email})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
