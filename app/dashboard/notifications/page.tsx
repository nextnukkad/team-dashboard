'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, Send, Users, CheckCircle, XCircle, Search, X } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

interface Notification {
  id: string
  title: string
  body: string
  target_type: 'all' | 'selected'
  total_recipients: number
  successful_sends: number
  failed_sends: number
  created_at: string
}

interface User {
  id: string
  name: string
  email: string
  city: string
  state: string
}

// Default notification templates - Friendly, catchy, non-offensive
const DEFAULT_TEMPLATES = [
  {
    title: "Hey! Feeling alone? 🤝",
    body: "Let's change that! Connect with someone nearby and have a great conversation."
  },
  {
    title: "Someone's waiting to chat! 💬",
    body: "People near you are online. Jump in and make a new friend today!"
  },
  {
    title: "Bored? We've got you! 🎉",
    body: "Connect with people around you now. You never know who you'll meet!"
  },
  {
    title: "Time for a quick chat? 👋",
    body: "Friendly faces are online and ready to talk. Come say hello!"
  },
  {
    title: "Aajao, logo se baat karo! 🎯",
    body: "Feeling lonely? Your next great conversation is just one tap away."
  },
  {
    title: "Break the silence! 🌟",
    body: "Connect with someone new today. Great conversations start with just 'Hi!'"
  }
]

export default function NotificationsPage() {
  const { showToast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Modal form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'selected'>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showToast('error', 'Not authenticated')
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      showToast('error', 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/dashboard/users', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      const data = await response.json()
      if (response.ok && data.users) {
        setUsers(data.users.filter((u: User) => u.name))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const openSendModal = () => {
    setShowModal(true)
    setTitle('')
    setBody('')
    setTargetType('all')
    setSelectedUsers([])
    fetchUsers()
  }

  const selectTemplate = (template: { title: string; body: string }) => {
    setTitle(template.title)
    setBody(template.body)
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      showToast('error', 'Please fill in title and body')
      return
    }

    if (targetType === 'selected' && selectedUsers.length === 0) {
      showToast('error', 'Please select at least one user')
      return
    }

    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showToast('error', 'Not authenticated')
        return
      }

      const response = await fetch('/api/dashboard/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          targetType,
          targetUsers: targetType === 'selected' ? selectedUsers : undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification')
      }

      showToast('success', `Notification sent! ${result.successfulSends}/${result.totalRecipients} successful`)
      setShowModal(false)
      fetchNotifications()
    } catch (error: any) {
      console.error('Error sending notification:', error)
      showToast('error', error.message || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const filteredUsers = userSearchQuery
    ? users.filter(u => 
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.city?.toLowerCase().includes(userSearchQuery.toLowerCase())
      )
    : users

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Push Notifications</h1>
          <p className="text-gray-500 mt-1">Send notifications to app users</p>
        </div>
        <button
          onClick={openSendModal}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
        >
          <Send size={20} />
          Send Notification
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bell className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Sent</p>
              <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Successful Deliveries</p>
              <p className="text-2xl font-bold text-gray-800">
                {notifications.reduce((sum, n) => sum + n.successful_sends, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Failed Deliveries</p>
              <p className="text-2xl font-bold text-gray-800">
                {notifications.reduce((sum, n) => sum + n.failed_sends, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Notification History</h2>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No notifications sent yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Send Notification" to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Body</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">{notif.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 text-sm line-clamp-2">{notif.body}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        notif.target_type === 'all' 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {notif.target_type === 'all' ? 'All Users' : 'Selected'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 text-sm">{notif.successful_sends} ✓</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-500 text-sm">{notif.total_recipients}</span>
                        {notif.failed_sends > 0 && (
                          <span className="text-red-500 text-sm ml-2">({notif.failed_sends} failed)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(notif.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Send Push Notification</h2>
                <p className="text-gray-500 text-sm mt-1">Create and send notifications to users</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Templates Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Templates (Click to use)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DEFAULT_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => selectTemplate(template)}
                      className={`text-left p-3 border rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors ${
                        title === template.title && body === template.body
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <p className="font-medium text-gray-800 text-sm">{template.title}</p>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{template.body}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Body *
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter notification message..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Target Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Send To
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setTargetType('all')}
                    className={`flex-1 p-4 border rounded-lg flex items-center justify-center gap-3 transition-colors ${
                      targetType === 'all'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users size={20} />
                    <span className="font-medium">All Users</span>
                  </button>
                  <button
                    onClick={() => setTargetType('selected')}
                    className={`flex-1 p-4 border rounded-lg flex items-center justify-center gap-3 transition-colors ${
                      targetType === 'selected'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CheckCircle size={20} />
                    <span className="font-medium">Select Users</span>
                  </button>
                </div>
              </div>

              {/* User Selection (if selected type) */}
              {targetType === 'selected' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Select Users ({selectedUsers.length} selected)
                    </label>
                    {selectedUsers.length > 0 && (
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="text-sm text-purple-600 hover:text-purple-700"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* User List */}
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No users found</div>
                    ) : (
                      filteredUsers.map((user) => (
                        <label
                          key={user.id}
                          className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                            selectedUsers.includes(user.id) ? 'bg-purple-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email} • {user.city}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendNotification}
                disabled={sending || !title.trim() || !body.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
