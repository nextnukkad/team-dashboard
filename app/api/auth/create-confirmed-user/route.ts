import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    console.log('👤 Creating confirmed user:', email, 'with name:', name)

    // Create user with email_confirmed = true using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This bypasses email confirmation
      user_metadata: {
        created_by: 'team_dashboard',
        name: name || email.split('@')[0], // Add name to metadata
        full_name: name || email.split('@')[0]
      }
    })

    if (authError) {
      console.error('❌ Failed to create confirmed user:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    console.log('✅ Confirmed user created:', authData.user.id)
    return NextResponse.json({ 
      success: true, 
      user: authData.user 
    })
  } catch (error: any) {
    console.error('💥 Error in create-confirmed-user:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
