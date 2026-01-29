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
    const { email, otp } = await req.json()
    console.log('🔍 Verify OTP Request:', { email, otp })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📊 Querying otp_verifications table...')
    const { data: otpRecord, error: otpError } = await supabaseClient
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('purpose', 'create')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError) {
      console.error('❌ OTP Query Error:', otpError)
      return new Response(
        JSON.stringify({ error: 'Invalid OTP', details: otpError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!otpRecord) {
      console.error('❌ No OTP record found for:', { email, otp })
      return new Response(
        JSON.stringify({ error: 'Invalid OTP - no matching record' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('✅ OTP Record Found:', otpRecord)

    const expiryTime = new Date(otpRecord.expires_at)
    const currentTime = new Date()
    console.log('⏰ Time Check:', { expiryTime, currentTime, isExpired: expiryTime < currentTime })

    if (expiryTime < currentTime) {
      console.error('❌ OTP Expired')
      await supabaseClient.from('otp_verifications').delete().eq('id', otpRecord.id)
      return new Response(
        JSON.stringify({ error: 'OTP has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('🗑️ Deleting OTP record after successful verification')
    await supabaseClient.from('otp_verifications').delete().eq('id', otpRecord.id)

    console.log('✅ OTP verified successfully')
    return new Response(
      JSON.stringify({ success: true, message: 'OTP verified successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('💥 Fatal Error in team-verify-otp:', error)
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
