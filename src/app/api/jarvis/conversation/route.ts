import { NextRequest, NextResponse } from 'next/server'
import { jarvisMemory } from '@/lib/jarvis-memory'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const recent = searchParams.get('recent') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let conversations

    if (recent) {
      conversations = await jarvisMemory.getRecentConversations(userId, limit)
    } else {
      conversations = await jarvisMemory.getConversationHistory(
        userId,
        sessionId || undefined,
        limit
      )
    }

    return NextResponse.json({
      conversations,
      count: conversations.length,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('JARVIS conversation API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, role, content, module, metadata } = body

    if (!userId || !sessionId || !role || !content) {
      return NextResponse.json(
        { error: 'User ID, session ID, role, and content are required' },
        { status: 400 }
      )
    }

    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "user" or "assistant"' },
        { status: 400 }
      )
    }

    const conversation = await jarvisMemory.saveConversation({
      userId,
      sessionId,
      role,
      content,
      module,
      metadata
    })

    return NextResponse.json({
      success: true,
      conversation,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('JARVIS conversation API POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save conversation' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const keepLastDays = parseInt(searchParams.get('keepLastDays') || '30')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const deletedCount = await jarvisMemory.cleanupOldConversations(userId, keepLastDays)

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('JARVIS conversation API DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup conversations' },
      { status: 500 }
    )
  }
}