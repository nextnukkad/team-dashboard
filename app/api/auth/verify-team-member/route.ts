import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 })
    }

    // Verify token using service role key
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is team member using service role key (bypasses RLS)
    const { data: teamMember, error: teamError } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (teamError || !teamMember) {
      return NextResponse.json({ 
        isTeamMember: false, 
        error: 'Not a team member' 
      }, { status: 403 })
    }

    // Update last_login and is_active using service role key
    await supabaseAdmin
      .from('team_members')
      .update({ 
        last_login: new Date().toISOString(),
        is_active: true
      })
      .eq('id', teamMember.id)

    return NextResponse.json({ 
      isTeamMember: true,
      teamMember 
    })
  } catch (error: any) {
    console.error('Verify team member error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
