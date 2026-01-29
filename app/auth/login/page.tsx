'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = async () => {
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
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Step 1: Login with Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user && authData.session) {
        // Step 2: Verify team membership via API (uses service role key, bypasses RLS)
        const verifyRes = await fetch('/api/auth/verify-team-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: authData.session.access_token })
        })

        const verifyData = await verifyRes.json()

        if (!verifyRes.ok || !verifyData.isTeamMember) {
          // Not a team member - logout and show error
          await supabase.auth.signOut()
          throw new Error('Not authorized. Only team members can access this dashboard.')
        }

        // Success - team member verified
        showToast('success', 'Login successful! Redirecting...')
        setTimeout(() => router.push('/dashboard'), 1000)
      }
    } catch (err: any) {
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
          <h2 className="text-xl font-semibold text-gray-800">Team Dashboard</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="vishal@nextnukkad.in"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
              Create Account
            </Link>
            <Link href="/auth/reset-password" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
