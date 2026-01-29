import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
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

    const body = await request.json()
    const { userId, status } = body

    if (!userId || !status) {
      return NextResponse.json({ error: 'userId and status required' }, { status: 400 })
    }

    if (!['approved', 'rejected', 'banned'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be approved, rejected, or banned' }, { status: 400 })
    }

    // Update user account_status using service role key
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ account_status: status })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log activity
    const activityType = status === 'approved' ? 'User approved' : 
                        status === 'rejected' ? 'User rejected' : 'User banned'
    
    await supabaseAdmin
      .from('user_activity_log')
      .insert({
        user_id: userId,
        activity_type: activityType,
        description: `Account ${status} by team member ${teamMember.email}`,
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
