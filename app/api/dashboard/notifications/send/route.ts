import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface SendNotificationRequest {
  title: string
  body: string
  targetType: 'all' | 'selected'
  targetUsers?: string[]
  data?: Record<string, unknown>
}

interface PushToken {
  user_id: string
  token: string
  platform: string
}

// Send push notification via Expo Push API
async function sendExpoPush(tokens: string[], title: string, body: string, data?: Record<string, unknown>) {
  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
    priority: 'high',
    channelId: 'default',
  }))

  // Expo allows max 100 notifications per request
  const chunks = []
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100))
  }

  let successCount = 0
  let failCount = 0

  for (const chunk of chunks) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(chunk),
      })

      const result = await response.json()
      console.log('Expo push result:', JSON.stringify(result))

      if (result.data) {
        for (const ticket of result.data) {
          if (ticket.status === 'ok') {
            successCount++
          } else {
            failCount++
            console.error('Push ticket error:', ticket.message)
          }
        }
      }
    } catch (error) {
      console.error('Error sending push notification chunk:', error)
      failCount += chunk.length
    }
  }

  return { successCount, failCount }
}

export async function POST(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '')

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is team member
    const { data: teamMember } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Parse request body
    const body: SendNotificationRequest = await request.json()
    const { title, body: notificationBody, targetType, targetUsers, data } = body

    // Validate request
    if (!title || !notificationBody) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    if (!targetType || !['all', 'selected'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid target type' }, { status: 400 })
    }

    if (targetType === 'selected' && (!targetUsers || targetUsers.length === 0)) {
      return NextResponse.json({ error: 'Target users required for selected type' }, { status: 400 })
    }

    console.log(`Sending notification: "${title}" to ${targetType} users`)

    // Get push tokens
    let pushTokens: PushToken[] = []

    if (targetType === 'all') {
      const { data: tokens, error } = await supabaseAdmin
        .from('push_tokens')
        .select('user_id, token, platform')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching tokens:', error)
        throw error
      }
      pushTokens = tokens || []
    } else {
      const { data: tokens, error } = await supabaseAdmin
        .from('push_tokens')
        .select('user_id, token, platform')
        .eq('is_active', true)
        .in('user_id', targetUsers!)

      if (error) {
        console.error('Error fetching tokens:', error)
        throw error
      }
      pushTokens = tokens || []
    }

    console.log(`Found ${pushTokens.length} push tokens`)

    if (pushTokens.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active push tokens found',
        totalRecipients: 0,
        successfulSends: 0,
        failedSends: 0
      })
    }

    // Get unique tokens
    const uniqueTokens = [...new Set(pushTokens.map(t => t.token))]
    const uniqueUserIds = [...new Set(pushTokens.map(t => t.user_id))]

    // Send push notifications
    const { successCount, failCount } = await sendExpoPush(uniqueTokens, title, notificationBody, data)

    // Save notification to database
    const { data: notification, error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        title,
        body: notificationBody,
        data: data || {},
        target_type: targetType,
        target_users: targetType === 'selected' ? targetUsers : [],
        total_recipients: uniqueTokens.length,
        successful_sends: successCount,
        failed_sends: failCount,
      })
      .select()
      .single()

    if (notifError) {
      console.error('Error saving notification:', notifError)
      // Don't fail the whole request, notification was still sent
    }

    // Create user_notifications entries for each user
    if (notification) {
      const userNotifications = uniqueUserIds.map(userId => ({
        notification_id: notification.id,
        user_id: userId,
        is_read: false,
      }))

      const { error: userNotifError } = await supabaseAdmin
        .from('user_notifications')
        .insert(userNotifications)

      if (userNotifError) {
        console.error('Error creating user notifications:', userNotifError)
      }
    }

    console.log(`Notification sent: ${successCount} success, ${failCount} failed`)

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      notificationId: notification?.id,
      totalRecipients: uniqueTokens.length,
      successfulSends: successCount,
      failedSends: failCount,
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
