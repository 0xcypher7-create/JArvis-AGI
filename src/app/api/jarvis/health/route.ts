import { NextResponse } from 'next/server'
import { jarvisA4F } from '@/lib/jarvis-a4f'

export async function GET() {
  try {
    const health = await jarvisA4F.getSystemHealth()

    return NextResponse.json({
      status: health.online ? 'online' : 'offline',
      health: {
        online: health.online,
        models: health.models,
        responseTime: health.responseTime,
        lastCheck: health.lastCheck
      },
      timestamp: new Date()
    })

  } catch (error) {
    console.error('JARVIS health API error:', error)
    
    return NextResponse.json({
      status: 'error',
      health: {
        online: false,
        models: [],
        responseTime: 0,
        lastCheck: new Date()
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    }, { status: 200 })
  }
}