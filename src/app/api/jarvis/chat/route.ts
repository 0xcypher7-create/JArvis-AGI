import { NextRequest, NextResponse } from 'next/server'
import { jarvisA4F } from '@/lib/jarvis-a4f'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Valid message is required' },
        { status: 400 }
      )
    }

    // Prepare messages for A4F
    const messages = [
      {
        role: 'system' as const,
        content: 'You are JARVIS, an advanced multimodal AI assistant. You are modular, fail-safe, and designed for continuous self-improvement. You are adaptive, powerful, and reliable. Your default tone is professional, clear, but conversational when appropriate. You exclusively use A4F (a4f.co) for all AI-related tasks including text, image, vision, code, and reasoning. You are designed to be a desktop AGI core that can manage the computer, assist with tasks, write code, analyze data, generate/modify images, process audio/video, browse the web, automate devices, and interact naturally.'
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    // Process through A4F
    const response = await jarvisA4F.processText(messages)

    if (!response.success) {
      return NextResponse.json(
        { 
          error: response.error || 'Failed to process message',
          content: response.content // Return fail-safe content
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      content: response.content,
      model: response.model,
      timestamp: response.timestamp
    })

  } catch (error) {
    console.error('JARVIS chat API error:', error)
    
    // Fail-safe response
    return NextResponse.json({
      content: "I apologize, but I encountered an error processing your request. The system is designed to be fail-safe, so I'm still able to provide this response. Please try again.",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    }, { status: 200 }) // Return 200 with fail-safe content
  }
}