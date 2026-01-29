'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Mail, User, Calendar, Eye, X } from 'lucide-react'

interface EarlyAccessUser {
  id: string
  name: string
  email: string
  device_type: string
  loneliness_frequency: string
  solution: string
  preference: string
  design: string
  locality: boolean
  city: boolean
  state: boolean
  radius: boolean
  additional_features: string
  other_questions: string
  created_at: string
}

export default function EarlyAccessPage() {
  const [users, setUsers] = useState<EarlyAccessUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<EarlyAccessUser | null>(null)

  useEffect(() => {
    fetchEarlyAccessUsers()
  }, [])

  const fetchEarlyAccessUsers = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session')
        setLoading(false)
        return
      }

      const response = await fetch('/api/dashboard/early-access', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch early access users')
      }

      const { earlyAccess: data } = await response.json()
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching early access users:', error)
    }
    setLoading(false)
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Early Access</h1>
        <p className="text-gray-600 mt-2">Users who signed up for early access</p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading early access users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preferences</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No early access users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {user.device_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {user.locality && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Locality</span>
                          )}
                          {user.city && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">City</span>
                          )}
                          {user.state && (
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">State</span>
                          )}
                          {user.radius && (
                            <span className="px-2 py-1 text-xs bg-pink-100 text-pink-800 rounded">Radius</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

      {/* View Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-purple-600 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Early Access Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Name</label>
                  <p className="text-gray-900 mt-1">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Email</label>
                  <p className="text-gray-900 mt-1">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Device Type</label>
                  <p className="text-gray-900 mt-1">{selectedUser.device_type}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Loneliness Frequency</label>
                  <p className="text-gray-900 mt-1">{selectedUser.loneliness_frequency}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Platform Preference</label>
                <p className="text-gray-900 mt-1">{selectedUser.preference}</p>
              </div>

              {selectedUser.solution && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Proposed Solution</label>
                  <p className="text-gray-900 mt-1">{selectedUser.solution}</p>
                </div>
              )}

              {selectedUser.design && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Design Preferences</label>
                  <p className="text-gray-900 mt-1">{selectedUser.design}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">"Chalo Nukkad Pe" Connection Preferences</label>
                <div className="flex gap-2">
                  {selectedUser.locality && (
                    <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full">Locality</span>
                  )}
                  {selectedUser.city && (
                    <span className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">City</span>
                  )}
                  {selectedUser.state && (
                    <span className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">State</span>
                  )}
                  {selectedUser.radius && (
                    <span className="px-3 py-1 text-xs bg-pink-100 text-pink-800 rounded-full">Radius</span>
                  )}
                </div>
              </div>

              {selectedUser.additional_features && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Additional Features Suggested</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedUser.additional_features}</p>
                </div>
              )}

              {selectedUser.other_questions && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Other Thoughts/Suggestions</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedUser.other_questions}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <label className="text-sm font-semibold text-gray-600">Submitted On</label>
                <p className="text-gray-900 mt-1">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      )}

      <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-800">
          <strong>Total Early Access Users:</strong> {users.length}
        </p>
      </div>
    </div>
  )
}
