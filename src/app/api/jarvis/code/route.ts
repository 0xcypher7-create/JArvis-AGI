import { NextRequest, NextResponse } from 'next/server'
import { jarvisCode } from '@/lib/jarvis-code'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, code, language, options = {} } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'analyze':
        if (!code) {
          return NextResponse.json(
            { error: 'Code is required for analyze action' },
            { status: 400 }
          )
        }
        result = await jarvisCode.analyzeCode(code, options)
        break
      
      case 'generate':
        if (!language || !body.requirements) {
          return NextResponse.json(
            { error: 'Language and requirements are required for generate action' },
            { status: 400 }
          )
        }
        result = await jarvisCode.generateCode(body.requirements, language, body.context)
        break
      
      case 'debug':
        if (!code) {
          return NextResponse.json(
            { error: 'Code is required for debug action' },
            { status: 400 }
          )
        }
        result = await jarvisCode.debugCode(code, body.error, language)
        break
      
      case 'optimize':
        if (!code) {
          return NextResponse.json(
            { error: 'Code is required for optimize action' },
            { status: 400 }
          )
        }
        result = await jarvisCode.optimizeCode(code, language, body.optimizationGoals)
        break
      
      case 'convert':
        if (!code || !body.sourceLanguage || !body.targetLanguage) {
          return NextResponse.json(
            { error: 'Code, source language, and target language are required for convert action' },
            { status: 400 }
          )
        }
        result = await jarvisCode.convertCode(code, body.sourceLanguage, body.targetLanguage)
        break
      
      case 'document':
        if (!code) {
          return NextResponse.json(
            { error: 'Code is required for document action' },
            { status: 400 }
          )
        }
        result = await jarvisCode.generateDocumentation(code, language, body.docType)
        break
      
      case 'execute':
        if (!code || !language) {
          return NextResponse.json(
            { error: 'Code and language are required for execute action' },
            { status: 400 }
          )
        }
        result = await jarvisCode.executeCode(code, { language, ...options })
        break
      
      case 'save-snippet':
        if (!code || !language || !body.title) {
          return NextResponse.json(
            { error: 'Code, language, and title are required for save-snippet action' },
            { status: 400 }
          )
        }
        result = await jarvisCode.saveSnippet({
          title: body.title,
          code,
          language,
          description: body.description,
          tags: body.tags || []
        })
        break
      
      case 'get-snippets':
        result = await jarvisCode.getSnippets(language, body.tags)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: analyze, generate, debug, optimize, convert, document, execute, save-snippet, get-snippets' },
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
    console.error('JARVIS code API error:', error)
    
    // Fail-safe response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      result: null,
      timestamp: new Date()
    }, { status: 200 })
  }
}