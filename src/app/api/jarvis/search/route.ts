import { NextRequest, NextResponse } from 'next/server'
import { jarvisA4F } from '@/lib/jarvis-a4f'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, numResults = 10 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Valid query is required' },
        { status: 400 }
      )
    }

    if (typeof numResults !== 'number' || numResults < 1 || numResults > 20) {
      return NextResponse.json(
        { error: 'numResults must be a number between 1 and 20' },
        { status: 400 }
      )
    }

    // Process through A4F
    const results = await jarvisA4F.webSearch(query, { numResults })

    return NextResponse.json({
      results,
      count: results.length,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('JARVIS web search API error:', error)
    
    // Fail-safe response
    return NextResponse.json({
      results: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    }, { status: 200 })
  }
}