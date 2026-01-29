'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'

export default function SignupPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    password: '',
    teamKey: '',
    otp: '',
  })
  const [loading, setLoading] = useState(false)

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.email.endsWith('@nextnukkad.in')) {
        throw new Error('Only @nextnukkad.in email addresses are allowed for team accounts')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/team-send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email: formData.email }),
        }
      )

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)

      showToast('success', 'OTP sent to your email. Please check your inbox.')
      setStep(2)
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Step 1: Verify OTP
      console.log('🔍 Verifying OTP...')
      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/team-verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email: formData.email, otp: formData.otp }),
        }
      )

      const verifyData = await verifyResponse.json()
      if (!verifyResponse.ok) {
        console.error('❌ OTP Verification Failed:', verifyData)
        throw new Error(verifyData.error || 'OTP verification failed')
      }
      console.log('✅ OTP Verified')

      // Step 2: Create confirmed auth user (bypasses email confirmation)
      console.log('👤 Creating confirmed auth user...')
      const createUserResponse = await fetch('/api/auth/create-confirmed-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name, // Pass name to be added to auth metadata
        }),
      })

      const createUserData = await createUserResponse.json()
      if (!createUserResponse.ok) {
        console.error('❌ Auth Error:', createUserData)
        throw new Error(createUserData.error || 'Failed to create user account')
      }

      const userId = createUserData.user.id
      console.log('✅ Confirmed auth user created:', userId)

      // Step 3: Verify team key and update created_by
      console.log('🔑 Verifying team key...')
      const keyResponse = await fetch('/api/auth/verify-team-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamKey: formData.teamKey,
          authId: userId  // Pass authId to set created_by
        }),
      })

      const keyData = await keyResponse.json()
      if (!keyResponse.ok) {
        console.error('❌ Team Key Verification Failed:', keyData)
        throw new Error(keyData.error)
      }
      console.log('✅ Team key verified')

      // Step 4: Create team member profile
      console.log('📝 Creating team member profile...')
      const teamMemberResponse = await fetch('/api/auth/create-team-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authId: userId,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          teamKeyId: keyData.keyId,
        }),
      })

      const memberData = await teamMemberResponse.json()
      if (!teamMemberResponse.ok) {
        console.error('❌ Team Member Creation Failed:', memberData)
        throw new Error(memberData.error || 'Failed to create team member profile')
      }
      console.log('✅ Team member profile created')

      showToast('success', 'Account created successfully! Redirecting...')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: any) {
      console.error('💥 Signup Error:', err)
      showToast('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <img src="/logo.png" alt="Next Nukkad" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-purple-600 mb-2">Next Nukkad</h1>
          <h2 className="text-xl font-semibold text-gray-800">Create Team Account</h2>
          <p className="text-gray-600 mt-2">Join the team dashboard</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="siku@nextnukkad.in"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Only @nextnukkad.in emails allowed</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="text-center text-sm">
              <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">
                Already have an account? Sign In
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyAndSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OTP Code
              </label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="123456"
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code sent to your email</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Vishal Veer Lohan"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Support">Support</option>
                <option value="Developer">Developer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Key
              </label>
              <input
                type="text"
                value={formData.teamKey}
                onChange={(e) => setFormData({ ...formData, teamKey: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="NUKKAD-TEAM-2025-001"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Ask your team leader for the key</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Back to Email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
