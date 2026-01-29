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

    // Fetch activity logs with user names using service role key
    const { data: activityLog } = await supabaseAdmin
      .from('user_activity_log')
      .select(`
        *,
        user:user_id (
          name,
          email
        )
      `)
      .in('activity_type', ['account_status_change', 'login', 'logout'])
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ activities: activityLog || [] })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
