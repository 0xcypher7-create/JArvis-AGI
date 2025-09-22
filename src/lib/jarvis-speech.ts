export interface SpeechToTextOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

export interface TextToSpeechOptions {
  voice?: string
  language?: string
  pitch?: number
  rate?: number
  volume?: number
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives?: Array<{
    transcript: string
    confidence: number
  }>
}

export interface VoiceInfo {
  name: string
  language: string
  localService: boolean
  default: boolean
}

export class JarvisSpeech {
  private recognition: any = null
  private synthesis: any = null
  private isListening = false
  private availableVoices: VoiceInfo[] = []

  constructor() {
    this.initialize()
  }

  private async initialize() {
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.setupRecognition()
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis
        this.loadVoices()
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.lang = 'en-US'

    this.recognition.onstart = () => {
      this.isListening = true
      console.log('Speech recognition started')
    }

    this.recognition.onend = () => {
      this.isListening = false
      console.log('Speech recognition ended')
    }

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      this.isListening = false
    }

    this.recognition.onresult = (event: any) => {
      const result = this.processRecognitionResult(event)
      console.log('Speech recognition result:', result)
    }
  }

  private loadVoices() {
    if (!this.synthesis) return

    const loadVoices = () => {
      this.availableVoices = this.synthesis.getVoices().map((voice: any) => ({
        name: voice.name,
        language: voice.lang,
        localService: voice.localService,
        default: voice.default
      }))
    }

    // Chrome loads voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices
    } else {
      loadVoices()
    }
  }

  private processRecognitionResult(event: any): SpeechRecognitionResult {
    const result = event.results[event.resultIndex]
    const transcript = result[0].transcript
    const confidence = result[0].confidence
    const isFinal = result.isFinal

    const alternatives = []
    for (let i = 1; i < result.length; i++) {
      alternatives.push({
        transcript: result[i].transcript,
        confidence: result[i].confidence
      })
    }

    return {
      transcript,
      confidence,
      isFinal,
      alternatives: alternatives.length > 0 ? alternatives : undefined
    }
  }

  /**
   * Start speech recognition
   */
  async startSpeechRecognition(
    options: SpeechToTextOptions = {}
  ): Promise<SpeechRecognitionResult> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported in this browser'))
        return
      }

      if (this.isListening) {
        reject(new Error('Speech recognition already in progress'))
        return
      }

      // Configure recognition options
      this.recognition.continuous = options.continuous || false
      this.recognition.interimResults = options.interimResults || false
      this.recognition.lang = options.language || 'en-US'

      const timeout = setTimeout(() => {
        this.recognition.stop()
        reject(new Error('Speech recognition timeout'))
      }, 30000) // 30 second timeout

      const onResult = (event: any) => {
        clearTimeout(timeout)
        const result = this.processRecognitionResult(event)
        
        // Remove event listeners
        this.recognition.removeEventListener('result', onResult)
        this.recognition.removeEventListener('error', onError)
        
        resolve(result)
      }

      const onError = (event: any) => {
        clearTimeout(timeout)
        this.recognition.removeEventListener('result', onResult)
        this.recognition.removeEventListener('error', onError)
        
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      this.recognition.addEventListener('result', onResult)
      this.recognition.addEventListener('error', onError)

      this.recognition.start()
    })
  }

  /**
   * Stop speech recognition
   */
  stopSpeechRecognition(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  /**
   * Convert text to speech
   */
  async textToSpeech(
    text: string,
    options: TextToSpeechOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported in this browser'))
        return
      }

      // Cancel any ongoing speech
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Configure utterance options
      if (options.voice) {
        const voice = this.availableVoices.find(v => v.name === options.voice)
        if (voice) {
          utterance.voice = this.synthesis.getVoices().find((v: any) => v.name === voice.name)
        }
      }

      utterance.lang = options.language || 'en-US'
      utterance.pitch = options.pitch || 1
      utterance.rate = options.rate || 1
      utterance.volume = options.volume || 1

      utterance.onend = () => {
        resolve()
      }

      utterance.onerror = (event: any) => {
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      this.synthesis.speak(utterance)
    })
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): VoiceInfo[] {
    return this.availableVoices
  }

  /**
   * Check if speech recognition is available
   */
  isSpeechRecognitionAvailable(): boolean {
    return this.recognition !== null
  }

  /**
   * Check if speech synthesis is available
   */
  isSpeechSynthesisAvailable(): boolean {
    return this.synthesis !== null
  }

  /**
   * Get current listening state
   */
  getListeningState(): boolean {
    return this.isListening
  }

  /**
   * Process audio file for speech recognition (server-side simulation)
   */
  async processAudioFile(
    audioData: string, // base64 or file reference
    options: SpeechToTextOptions = {}
  ): Promise<SpeechRecognitionResult> {
    // This would typically be processed server-side
    // For now, we'll simulate the result
    
    // In a real implementation, this would:
    // 1. Send audio to server
    // 2. Process with STT engine (Vosk, Deepgram, etc.)
    // 3. Return structured result
    
    return {
      transcript: "Simulated speech recognition result from audio file",
      confidence: 0.95,
      isFinal: true
    }
  }

  /**
   * Generate speech with specific voice characteristics
   */
  async generateSpeechWithPersona(
    text: string,
    persona: 'jarvis' | 'assistant' | 'professional' | 'friendly' = 'jarvis'
  ): Promise<void> {
    const personaSettings = {
      jarvis: {
        voice: this.availableVoices.find(v => v.name.toLowerCase().includes('male'))?.name,
        rate: 0.9,
        pitch: 1.1,
        language: 'en-US'
      },
      assistant: {
        voice: this.availableVoices.find(v => v.name.toLowerCase().includes('female'))?.name,
        rate: 1.0,
        pitch: 1.0,
        language: 'en-US'
      },
      professional: {
        voice: this.availableVoices.find(v => v.default)?.name,
        rate: 0.8,
        pitch: 0.9,
        language: 'en-US'
      },
      friendly: {
        voice: this.availableVoices.find(v => v.name.toLowerCase().includes('natural'))?.name,
        rate: 1.1,
        pitch: 1.2,
        language: 'en-US'
      }
    }

    const settings = personaSettings[persona]
    
    return await this.textToSpeech(text, settings)
  }

  /**
   * Real-time conversation mode
   */
  async startConversationMode(
    onSpeechRecognized: (result: SpeechRecognitionResult) => void,
    options: SpeechToTextOptions = {}
  ): Promise<() => void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported')
    }

    const stopConversationMode = () => {
      this.stopSpeechRecognition()
      this.recognition.removeEventListener('result', handleResult)
    }

    const handleResult = (event: any) => {
      const result = this.processRecognitionResult(event)
      onSpeechRecognized(result)
    }

    // Configure for continuous recognition
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = options.language || 'en-US'

    this.recognition.addEventListener('result', handleResult)
    this.recognition.start()

    return stopConversationMode
  }
}

// Singleton instance
export const jarvisSpeech = new JarvisSpeech()