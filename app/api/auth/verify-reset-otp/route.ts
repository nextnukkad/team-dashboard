import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()
    console.log('🔑 Verifying reset OTP:', { email, otp })

    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('purpose', 'reset')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      console.error('❌ Invalid or missing OTP:', otpError)
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      console.error('❌ OTP expired')
      await supabaseAdmin.from('otp_verifications').delete().eq('id', otpRecord.id)
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 })
    }

    console.log('✅ Reset OTP verified successfully')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('💥 Error in verify-reset-otp:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
