'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Eye, Check, X, Ban } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

interface User {
  id: string
  email: string
  phone: string
  name: string
  locality: string
  city: string
  state: string
  account_status: 'pending' | 'approved' | 'rejected' | 'banned'
  account_mode: 'freemium' | 'premium'
  created_at: string
}

interface UserInterests {
  favorite_games: string[]
  favorite_celebrities: string[]
  favorite_foods: string[]
  hobbies: string[]
  music_preferences: string[]
  movie_genres: string[]
  sports_interests: string[]
}

interface UserWithDetails extends User {
  interests?: UserInterests
}

export default function UserManagementPage() {
  const { showToast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from API...')
      
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showToast('error', 'Not authenticated')
        return
      }

      // Fetch from API (uses service role key on server)
      const response = await fetch('/api/dashboard/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const data = await response.json()

      if (!response.ok) {
        console.error('Error fetching users:', data.error)
        showToast('error', 'Failed to load users: ' + data.error)
        return
      }

      console.log('Fetched users:', data.users?.length || 0)
      if (data.users) {
        // Set default status to 'approved' for users with 'pending' status
        const processedData = data.users.map((user: any) => ({
          ...user,
          account_status: user.account_status || 'approved'
        }))
        setUsers(processedData)
        setFilteredUsers(processedData)
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      showToast('error', 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (user: User) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showToast('error', 'Session expired. Please login again')
        return
      }

      const response = await fetch(`/api/dashboard/user-interests?user_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch interests')
        showToast('warning', 'Could not load user interests')
        setSelectedUser({ ...user, interests: undefined })
        return
      }

      const { interests } = await response.json()
      setSelectedUser({ ...user, interests: interests?.[0] || undefined })
    } catch (error: any) {
      console.error('Error fetching user details:', error)
      showToast('error', 'Failed to load user details')
      setSelectedUser({ ...user, interests: undefined })
    }
  }

  const handleUpdateStatus = async (userId: string, status: 'approved' | 'rejected' | 'banned') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showToast('error', 'Session expired. Please login again')
        return
      }

      const response = await fetch('/api/dashboard/update-user-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, status })
      })

      if (!response.ok) {
        const error = await response.json()
        showToast('error', `Failed to update status: ${error.error || 'Unknown error'}`)
        return
      }

      showToast('success', `User ${status} successfully!`)
      fetchUsers()
      setSelectedUser(null)
    } catch (error: any) {
      console.error('Error updating user status:', error)
      showToast('error', 'Failed to update user status')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      banned: 'bg-gray-800 text-white',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-600 mt-1">Manage and review user accounts</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.city}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.state}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {user.account_status === 'approved' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Check size={18} className="font-bold" />
                          <span className="text-sm font-medium">Approved</span>
                        </div>
                      )}
                      {user.account_status === 'rejected' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <X size={18} className="font-bold" />
                          <span className="text-sm font-medium">Rejected</span>
                        </div>
                      )}
                      {user.account_status === 'banned' && (
                        <div className="flex items-center gap-1 text-gray-800">
                          <Ban size={18} className="font-bold" />
                          <span className="text-sm font-medium">Banned</span>
                        </div>
                      )}
                      {user.account_status === 'pending' && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 capitalize">{user.account_mode}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(user)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h2>
                <p className="text-gray-600">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-800">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="font-medium text-gray-800">{selectedUser.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">State</p>
                  <p className="font-medium text-gray-800">{selectedUser.state || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Locality</p>
                  <p className="font-medium text-gray-800">{selectedUser.locality || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Mode</p>
                  <p className="font-medium text-gray-800 capitalize">{selectedUser.account_mode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Status</p>
                  <p className="font-medium text-gray-800 capitalize">{selectedUser.account_status}</p>
                </div>
              </div>

              {selectedUser.interests && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">User Interests</h3>
                  
                  {selectedUser.interests.favorite_games && selectedUser.interests.favorite_games.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Favorite Games</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.interests.favorite_games.map((game: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                            {game}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.interests.favorite_celebrities && selectedUser.interests.favorite_celebrities.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Favorite Celebrities</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.interests.favorite_celebrities.map((celeb: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                            {celeb}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.interests.favorite_foods && selectedUser.interests.favorite_foods.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Favorite Foods</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.interests.favorite_foods.map((food: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                            {food}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.interests.hobbies && selectedUser.interests.hobbies.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Hobbies</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.interests.hobbies.map((hobby: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {hobby}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.interests.music_preferences && selectedUser.interests.music_preferences.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Music Preferences</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.interests.music_preferences.map((music: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {music}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.interests.movie_genres && selectedUser.interests.movie_genres.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Movie Genres</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.interests.movie_genres.map((genre: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.interests.sports_interests && selectedUser.interests.sports_interests.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Sports Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.interests.sports_interests.map((sport: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                            {sport}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!selectedUser.interests && (
                <div className="text-center py-4 text-gray-500">
                  <p>No interests data available for this user</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleUpdateStatus(selectedUser.id, 'approved')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Check size={20} />
                Approve
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedUser.id, 'rejected')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <X size={20} />
                Reject
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedUser.id, 'banned')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
              >
                <Ban size={20} />
                Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
