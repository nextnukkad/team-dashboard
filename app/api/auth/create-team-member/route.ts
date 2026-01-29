import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { authId, email, name, role, teamKeyId } = await request.json()
    console.log('👤 Creating team member:', { authId, email, name, role, teamKeyId })

    const { data, error } = await supabaseAdmin
      .from('team_members')
      .insert({
        auth_id: authId,
        email,
        name,
        role,
        team_key_used: teamKeyId,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to create team member:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('✅ Team member created successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('💥 Error in create-team-member:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
