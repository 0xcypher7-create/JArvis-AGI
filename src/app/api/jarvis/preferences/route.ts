import { NextRequest, NextResponse } from 'next/server'
import { jarvisMemory } from '@/lib/jarvis-memory'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const preferences = await jarvisMemory.getUserPreferences(userId)

    if (!preferences) {
      // Return default preferences if none exist
      return NextResponse.json({
        preferences: {
          userId,
          personality: 'professional',
          responseStyle: 'balanced',
          language: 'en',
          theme: 'dark',
          voiceEnabled: false,
          autoSaveHistory: true,
          maxHistoryLength: 100
        },
        timestamp: new Date()
      })
    }

    return NextResponse.json({
      preferences,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('JARVIS preferences API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...preferences } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await jarvisMemory.upsertUserPreferences({
      userId,
      ...preferences
    })

    return NextResponse.json({
      success: true,
      preferences: result,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('JARVIS preferences API POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}