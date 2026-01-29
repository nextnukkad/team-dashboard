import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    console.log('✅ Confirming email for:', email)

    // Get user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Failed to list users:', listError)
      return NextResponse.json({ error: listError.message }, { status: 400 })
    }

    const user = users.find(u => u.email === email)
    
    if (!user) {
      console.error('❌ User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user to confirmed
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('❌ Failed to confirm user:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    console.log('✅ User email confirmed successfully')
    return NextResponse.json({ 
      success: true, 
      message: 'Email confirmed successfully',
      user: updatedUser.user
    })
  } catch (error: any) {
    console.error('💥 Error in confirm-email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
