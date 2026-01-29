'use client'

import { Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your team dashboard</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-dashed border-purple-300 rounded-xl p-12 text-center">
          <SettingsIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-purple-900 mb-2">Coming Soon</h2>
          <p className="text-purple-700">
            Settings and configuration options will be available here soon.
          </p>
        </div>
      </div>
    </div>
  )
}
