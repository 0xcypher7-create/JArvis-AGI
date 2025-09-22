import { NextRequest, NextResponse } from 'next/server'
import { jarvisVision } from '@/lib/jarvis-vision'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, prompt, imageData, options = {} } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'generate':
        if (!prompt) {
          return NextResponse.json(
            { error: 'Prompt is required for generate action' },
            { status: 400 }
          )
        }
        result = await jarvisVision.generateImage(prompt, options)
        break
      
      case 'analyze':
        if (!imageData) {
          return NextResponse.json(
            { error: 'Image data is required for analyze action' },
            { status: 400 }
          )
        }
        result = await jarvisVision.analyzeImage(imageData, options)
        break
      
      case 'variations':
        if (!imageData) {
          return NextResponse.json(
            { error: 'Image data is required for variations action' },
            { status: 400 }
          )
        }
        const { count = 3 } = body
        result = await jarvisVision.generateVariations(imageData, count, options)
        break
      
      case 'edit':
        if (!imageData || !prompt) {
          return NextResponse.json(
            { error: 'Image data and edit instructions are required for edit action' },
            { status: 400 }
          )
        }
        result = await jarvisVision.editImage(imageData, prompt, options)
        break
      
      case 'extract-text':
        if (!imageData) {
          return NextResponse.json(
            { error: 'Image data is required for extract-text action' },
            { status: 400 }
          )
        }
        result = await jarvisVision.extractText(imageData)
        break
      
      case 'detect-objects':
        if (!imageData) {
          return NextResponse.json(
            { error: 'Image data is required for detect-objects action' },
            { status: 400 }
          )
        }
        result = await jarvisVision.detectObjects(imageData)
        break
      
      case 'style-convert':
        if (!imageData || !prompt) {
          return NextResponse.json(
            { error: 'Image data and target style are required for style-convert action' },
            { status: 400 }
          )
        }
        result = await jarvisVision.convertStyle(imageData, prompt)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: generate, analyze, variations, edit, extract-text, detect-objects, style-convert' },
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
    console.error('JARVIS vision API error:', error)
    
    // Fail-safe response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      result: null,
      timestamp: new Date()
    }, { status: 200 })
  }
}