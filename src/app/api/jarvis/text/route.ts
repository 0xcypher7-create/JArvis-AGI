import { NextRequest, NextResponse } from 'next/server'
import { jarvisText } from '@/lib/jarvis-text'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, text, options = {} } = body

    if (!action || !text) {
      return NextResponse.json(
        { error: 'Action and text are required' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'process':
        result = await jarvisText.processText(text, options)
        break
      
      case 'reason':
        const { context } = body
        result = await jarvisText.reason(text, context)
        break
      
      case 'analyze':
        const analysis = await jarvisText.analyzeText(text)
        result = analysis
        break
      
      case 'create':
        const { type = 'idea' } = body
        result = await jarvisText.generateCreative(text, type)
        break
      
      case 'explain':
        const { audience = 'intermediate' } = body
        result = await jarvisText.explainConcept(text, audience)
        break
      
      case 'compare':
        const { items, criteria } = body
        if (!Array.isArray(items) || items.length < 2) {
          return NextResponse.json(
            { error: 'Items must be an array with at least 2 elements' },
            { status: 400 }
          )
        }
        result = await jarvisText.compareItems(items, criteria)
        break
      
      case 'variations':
        const { variations } = body
        if (!Array.isArray(variations) || variations.length === 0) {
          return NextResponse.json(
            { error: 'Variations must be an array with at least one variation type' },
            { status: 400 }
          )
        }
        result = await jarvisText.generateVariations(text, variations)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: process, reason, analyze, create, explain, compare, variations' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      result,
      action,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('JARVIS text processing API error:', error)
    
    // Fail-safe response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      result: 'I apologize, but I encountered an error processing your text. The system is designed to be fail-safe, so please try again.',
      timestamp: new Date()
    }, { status: 200 })
  }
}