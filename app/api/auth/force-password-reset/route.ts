import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json()
    console.log('🔐 Force password reset for:', email)

    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('auth_id')
      .eq('email', email)
      .single()

    if (!teamMember || !teamMember.auth_id) {
      console.error('❌ Team member not found')
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    console.log('📝 Updating password for auth_id:', teamMember.auth_id)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      teamMember.auth_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ Failed to update password:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Delete all reset OTPs for this email
    console.log('🗑️ Deleting reset OTPs')
    await supabaseAdmin
      .from('otp_verifications')
      .delete()
      .eq('email', email)
      .eq('purpose', 'reset')

    console.log('✅ Password reset successfully')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('💥 Error in force-password-reset:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
