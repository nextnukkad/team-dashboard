'use client'

import { useState } from 'react'

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState('tech@nextnukkad.in')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/auth/confirm-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage(`✅ Success: ${data.message}`)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-purple-600 mb-4">Confirm Email</h1>
        <p className="text-gray-600 mb-6">Manually confirm existing user email addresses</p>
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          placeholder="user@nextnukkad.in"
        />
        
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Confirming...' : 'Confirm Email'}
        </button>
        
        {message && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
