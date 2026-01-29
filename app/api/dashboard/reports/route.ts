import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Fetch all data using service role key
    const [userReports, blockedUsers, activityLogs] = await Promise.all([
      supabaseAdmin.from('user_reports').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('blocked_users').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('user_activity_log').select('*').order('created_at', { ascending: false }).limit(100)
    ])

    return NextResponse.json({ 
      userReports: userReports.data || [],
      blockedUsers: blockedUsers.data || [],
      activityLogs: activityLogs.data || []
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
