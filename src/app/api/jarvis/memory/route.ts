import { NextRequest, NextResponse } from 'next/server'
import { jarvisMemory } from '@/lib/jarvis-memory'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const query = searchParams.get('query')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (query) {
      // Search memories
      const memories = await jarvisMemory.searchMemories(userId, query)
      return NextResponse.json({
        memories,
        count: memories.length,
        timestamp: new Date()
      })
    } else {
      // Get memories by type/category
      const memories = await jarvisMemory.getMemories(userId, type || undefined, category || undefined)
      return NextResponse.json({
        memories,
        count: memories.length,
        timestamp: new Date()
      })
    }

  } catch (error) {
    console.error('JARVIS memory API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve memories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (!action || !data) {
      return NextResponse.json(
        { error: 'Action and data are required' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'upsert':
        result = await jarvisMemory.upsertMemory(data)
        break
      
      case 'strengthen':
        if (!data.id) {
          return NextResponse.json(
            { error: 'Memory ID is required for strengthen action' },
            { status: 400 }
          )
        }
        result = await jarvisMemory.strengthenMemory(data.id)
        break
      
      case 'weaken':
        if (!data.id) {
          return NextResponse.json(
            { error: 'Memory ID is required for weaken action' },
            { status: 400 }
          )
        }
        result = await jarvisMemory.weakenMemory(data.id)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('JARVIS memory API POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process memory operation' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memoryId = searchParams.get('id')

    if (!memoryId) {
      return NextResponse.json(
        { error: 'Memory ID is required' },
        { status: 400 }
      )
    }

    const result = await jarvisMemory.weakenMemory(memoryId)
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('JARVIS memory API DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete memory' },
      { status: 500 }
    )
  }
}