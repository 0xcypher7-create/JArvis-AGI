import ZAI from 'z-ai-web-dev-sdk'

export interface A4FMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface A4FResponse {
  content: string
  success: boolean
  error?: string
  model?: string
  timestamp: Date
}

export interface A4FImageResponse {
  base64: string
  success: boolean
  error?: string
  timestamp: Date
}

export interface A4FSearchResult {
  url: string
  name: string
  snippet: string
  host_name: string
  rank: number
  date: string
  favicon: string
}

export class JarvisA4F {
  private zai: any = null
  private isInitialized = false
  private availableModels: string[] = []
  private currentModelIndex = 0

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      this.zai = await ZAI.create()
      this.isInitialized = true
      console.log('JARVIS A4F integration initialized successfully')
    } catch (error) {
      console.error('Failed to initialize JARVIS A4F integration:', error)
      this.isInitialized = false
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized || !this.zai) {
      await this.initialize()
    }
    
    if (!this.isInitialized || !this.zai) {
      throw new Error('A4F integration failed to initialize. JARVIS operating in degraded mode.')
    }
  }

  /**
   * Process text-based queries through A4F models
   */
  async processText(
    messages: A4FMessage[],
    options: {
      temperature?: number
      maxTokens?: number
      model?: string
    } = {}
  ): Promise<A4FResponse> {
    try {
      await this.ensureInitialized()

      const defaultOptions = {
        temperature: 0.7,
        maxTokens: 2000,
        ...options
      }

      const completion = await this.zai.chat.completions.create({
        messages,
        temperature: defaultOptions.temperature,
        max_tokens: defaultOptions.maxTokens
      })

      const messageContent = completion.choices[0]?.message?.content

      return {
        content: messageContent || 'No response received from A4F model.',
        success: true,
        model: completion.model || 'unknown',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('A4F text processing error:', error)
      return {
        content: 'I apologize, but I encountered an error processing your request. This is a fail-safe response - please try again.',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  /**
   * Generate images through A4F imagen endpoints
   */
  async generateImage(
    prompt: string,
    options: {
      size?: '1024x1024' | '512x512' | '256x256'
      style?: string
    } = {}
  ): Promise<A4FImageResponse> {
    try {
      await this.ensureInitialized()

      const defaultOptions = {
        size: '1024x1024' as const,
        ...options
      }

      const response = await this.zai.images.generations.create({
        prompt,
        size: defaultOptions.size
      })

      const imageBase64 = response.data[0]?.base64

      if (!imageBase64) {
        throw new Error('No image data received from A4F')
      }

      return {
        base64: imageBase64,
        success: true,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('A4F image generation error:', error)
      return {
        base64: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  /**
   * Perform web search through A4F
   */
  async webSearch(
    query: string,
    options: {
      numResults?: number
    } = {}
  ): Promise<A4FSearchResult[]> {
    try {
      await this.ensureInitialized()

      const defaultOptions = {
        numResults: 10,
        ...options
      }

      const searchResult = await this.zai.functions.invoke('web_search', {
        query,
        num: defaultOptions.numResults
      })

      return searchResult || []
    } catch (error) {
      console.error('A4F web search error:', error)
      return []
    }
  }

  /**
   * Process code-related tasks through A4F
   */
  async processCode(
    code: string,
    task: 'write' | 'debug' | 'optimize' | 'explain',
    language?: string
  ): Promise<A4FResponse> {
    const systemPrompt = `You are an expert programming assistant. You are helping with ${task} task for ${language || 'a programming language'}. 
    Provide clear, accurate, and helpful responses. Include code examples when appropriate.
    Always prioritize security, best practices, and readability.`

    const userPrompt = `${task.toUpperCase()}: ${code}

${language ? `Language: ${language}` : ''}

Please provide a comprehensive response that includes:
1. Analysis of the code
2. ${task === 'debug' ? 'Identified issues and fixes' : task === 'optimize' ? 'Optimization suggestions' : task === 'explain' ? 'Detailed explanation' : 'Improved code'}
3. Best practices and recommendations
4. Any security considerations`

    return this.processText([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ])
  }

  /**
   * Multi-step reasoning and task chaining
   */
  async processComplexTask(
    task: string,
    steps: string[]
  ): Promise<A4FResponse[]> {
    const results: A4FResponse[] = []

    for (const step of steps) {
      const stepPrompt = `You are JARVIS, an advanced AI assistant. You are currently working on a complex task.

Main Task: ${task}

Current Step: ${step}

Please complete this step thoroughly and provide a clear response. Your response will be used as input for the next step in the task chain.`

      const result = await this.processText([
        {
          role: 'system',
          content: 'You are JARVIS, an advanced multimodal AI assistant. You are modular, fail-safe, and designed for continuous self-improvement. You are adaptive, powerful, and reliable. Your default tone is professional, clear, but conversational when appropriate.'
        },
        { role: 'user', content: stepPrompt }
      ])

      results.push(result)

      // If any step fails, break the chain
      if (!result.success) {
        break
      }
    }

    return results
  }

  /**
   * Get system status and health
   */
  async getSystemHealth(): Promise<{
    online: boolean
    models: string[]
    responseTime: number
    lastCheck: Date
  }> {
    const startTime = Date.now()
    
    try {
      await this.ensureInitialized()
      
      // Test with a simple query
      await this.processText([
        { role: 'user', content: 'test' }
      ])
      
      const responseTime = Date.now() - startTime
      
      return {
        online: true,
        models: this.availableModels,
        responseTime,
        lastCheck: new Date()
      }
    } catch (error) {
      return {
        online: false,
        models: [],
        responseTime: Date.now() - startTime,
        lastCheck: new Date()
      }
    }
  }

  /**
   * Fail-safe model rotation
   */
  async withFailSafe<T>(
    operation: () => Promise<T>,
    fallbackOperations: (() => Promise<T>)[] = []
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      console.warn('Primary operation failed, attempting fallbacks...')
      
      for (const fallback of fallbackOperations) {
        try {
          const result = await fallback()
          console.log('Fallback operation succeeded')
          return result
        } catch (fallbackError) {
          console.warn('Fallback operation failed:', fallbackError)
          continue
        }
      }
      
      throw new Error('All operations failed including fallbacks')
    }
  }

  /**
   * Intelligent model selection based on task type
   */
  async selectModelForTask(taskType: 'text' | 'code' | 'creative' | 'analysis'): Promise<string> {
    // This would be implemented with logic to select the best model
    // For now, return a default
    const modelMap = {
      text: 'text-completion',
      code: 'code-assistant',
      creative: 'creative-writing',
      analysis: 'analytical-reasoning'
    }
    
    return modelMap[taskType] || 'general-purpose'
  }
}

// Singleton instance
export const jarvisA4F = new JarvisA4F()