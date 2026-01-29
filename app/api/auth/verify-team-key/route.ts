import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { teamKey, authId } = await request.json()
    console.log('🔑 Verifying team key:', { teamKey, authId })

    const { data: key, error } = await supabaseAdmin
      .from('team_keys')
      .select('*')
      .eq('key_code', teamKey)
      .eq('is_active', true)
      .single()

    if (error || !key) {
      console.error('❌ Invalid team key:', error)
      return NextResponse.json({ error: 'Invalid team key' }, { status: 400 })
    }

    if (key.current_uses >= key.max_uses) {
      console.error('❌ Team key max uses reached')
      return NextResponse.json({ error: 'Team key has reached maximum uses' }, { status: 400 })
    }

    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      console.error('❌ Team key expired')
      return NextResponse.json({ error: 'Team key has expired' }, { status: 400 })
    }

    // Update current_uses and created_by (if first use)
    const updateData: any = { current_uses: key.current_uses + 1 }
    if (authId && !key.created_by) {
      updateData.created_by = authId
    }

    console.log('📝 Updating team key:', updateData)
    const { error: updateError } = await supabaseAdmin
      .from('team_keys')
      .update(updateData)
      .eq('id', key.id)

    if (updateError) {
      console.error('❌ Failed to update team key:', updateError)
      throw updateError
    }

    console.log('✅ Team key verified and updated successfully')
    return NextResponse.json({ success: true, keyId: key.id })
  } catch (error: any) {
    console.error('💥 Error in verify-team-key:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
