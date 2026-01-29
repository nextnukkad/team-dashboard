import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    console.log('📧 Send OTP request for:', email)

    if (!email || !email.endsWith('@nextnukkad.in')) {
      console.error('❌ Invalid email domain')
      return new Response(
        JSON.stringify({ error: 'Only @nextnukkad.in email addresses are allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if email already exists in team_members
    console.log('🔍 Checking if email already exists...')
    const { data: existingMember } = await supabaseClient
      .from('team_members')
      .select('email')
      .eq('email', email)
      .single()

    if (existingMember) {
      console.error('❌ Email already registered')
      return new Response(
        JSON.stringify({ error: 'Email already registered. Please login or reset your password.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    console.log('✅ Email is new')

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('🔢 Generated OTP for', email)

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    console.log('📧 Sending OTP email...')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Next Nukkad Team <team@nextnukkad.in>',
        to: [email],
        subject: 'Your OTP for Next Nukkad Team Registration',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0;">Next Nukkad Team Dashboard</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">Verification Code</h2>
              <p style="color: #4b5563; font-size: 16px;">Your OTP for team registration is:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h1 style="color: #7c3aed; font-size: 42px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>© 2025 Next Nukkad. All rights reserved.</p>
            </div>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('❌ Failed to send email:', error)
      throw new Error(`Failed to send email: ${error}`)
    }
    console.log('✅ Email sent successfully')

    // Store OTP in otp_verifications table with purpose='create'
    console.log('💾 Storing OTP in otp_verifications table')
    const { error: dbError } = await supabaseClient
      .from('otp_verifications')
      .insert({
        email: email,
        otp: otp,
        purpose: 'create',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })

    if (dbError) {
      console.error('❌ Failed to store OTP:', dbError)
      throw new Error(`Failed to store OTP: ${dbError.message}`)
    }

    console.log('✅ OTP stored successfully')
    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('💥 Error in team-send-otp:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
