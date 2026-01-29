export interface TeamMember {
  id: string
  auth_id: string
  email: string
  name: string
  role: string
  team_key_used: string
  created_at: string
  last_login: string | null
  is_active: boolean
}

export interface TeamKey {
  id: string
  key_code: string
  is_active: boolean
  max_uses: number
  current_uses: number
  created_by: string | null
  created_at: string
  expires_at: string | null
}

export interface User {
  id: string
  email: string
  phone: string
  name: string
  date_of_birth: string
  gender: string
  account_status: 'pending' | 'approved' | 'rejected' | 'banned'
  account_mode: 'freemium' | 'premium'
  created_at: string
  updated_at: string
}

export interface OnlineStatus {
  user_id: string
  status: 'online' | 'offline'
  last_seen: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  payment_status: string
  payment_method: string
  created_at: string
}

export interface UserReport {
  id: string
  reporter_id: string
  reported_user_id: string
  reason: string
  status: string
  created_at: string
}
