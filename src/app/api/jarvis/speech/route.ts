import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const check = searchParams.get('check')

    if (check === 'recognition') {
      // Check if speech recognition is available
      return NextResponse.json({
        available: true, // This would be determined by browser capabilities
        voices: [], // Would be populated with available voices
        timestamp: new Date()
      })
    }

    if (check === 'synthesis') {
      // Check if speech synthesis is available
      return NextResponse.json({
        available: true, // This would be determined by browser capabilities
        voices: [], // Would be populated with available voices
        timestamp: new Date()
      })
    }

    return NextResponse.json({
      error: 'Invalid check parameter. Use "recognition" or "synthesis".'
    }, { status: 400 })

  } catch (error) {
    console.error('JARVIS speech API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to check speech capabilities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, text, audioData, options = {} } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'stt':
        // Speech-to-text (client-side would handle actual audio processing)
        return NextResponse.json({
          success: true,
          message: 'Speech-to-text processing should be handled client-side using Web Speech API',
          clientSide: true,
          timestamp: new Date()
        })
      
      case 'tts':
        if (!text) {
          return NextResponse.json(
            { error: 'Text is required for text-to-speech' },
            { status: 400 }
          )
        }
        // Text-to-speech (client-side would handle actual audio playback)
        return NextResponse.json({
          success: true,
          text,
          options,
          message: 'Text-to-speech processing should be handled client-side using Web Speech API',
          clientSide: true,
          timestamp: new Date()
        })
      
      case 'process-audio':
        if (!audioData) {
          return NextResponse.json(
            { error: 'Audio data is required for process-audio action' },
            { status: 400 }
          )
        }
        // Simulate audio file processing
        result = {
          transcript: "Simulated transcription from audio file",
          confidence: 0.92,
          isFinal: true
        }
        break
      
      case 'get-voices':
        // Get available voices
        result = [
          {
            name: "Google US English",
            language: "en-US",
            localService: true,
            default: true
          },
          {
            name: "Google UK English Female",
            language: "en-GB",
            localService: true,
            default: false
          }
        ]
        break
      
      case 'persona-speech':
        if (!text) {
          return NextResponse.json(
            { error: 'Text is required for persona-speech action' },
            { status: 400 }
          )
        }
        const { persona = 'jarvis' } = body
        result = {
          text,
          persona,
          message: 'Persona speech should be handled client-side with appropriate voice settings',
          clientSide: true
        }
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: stt, tts, process-audio, get-voices, persona-speech' },
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
    console.error('JARVIS speech API error:', error)
    
    // Fail-safe response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      result: null,
      timestamp: new Date()
    }, { status: 200 })
  }
}