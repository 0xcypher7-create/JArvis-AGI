import { jarvisA4F } from './jarvis-a4f'

export interface TextProcessingOptions {
  temperature?: number
  maxTokens?: number
  reasoningSteps?: boolean
  contextAwareness?: boolean
  creativeMode?: boolean
  analyticalMode?: boolean
}

export interface ReasoningStep {
  step: number
  title: string
  content: string
  conclusion?: string
}

export interface TextAnalysisResult {
  summary: string
  keyPoints: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  topics: string[]
  complexity: 'low' | 'medium' | 'high'
  wordCount: number
  readingTime: number
}

export interface ReasoningResult {
  finalAnswer: string
  steps: ReasoningStep[]
  confidence: number
  assumptions: string[]
  sources?: string[]
}

export class JarvisTextProcessing {
  /**
   * Advanced text processing with multiple capabilities
   */
  async processText(
    text: string,
    options: TextProcessingOptions = {}
  ): Promise<string> {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      reasoningSteps = false,
      contextAwareness = false,
      creativeMode = false,
      analyticalMode = false
    } = options

    let systemPrompt = `You are JARVIS, an advanced AI assistant. You are adaptive, powerful, and reliable. Your default tone is professional, clear, but conversational when appropriate.`

    if (reasoningSteps) {
      systemPrompt += ` You excel at step-by-step reasoning and breaking down complex problems into manageable parts. Always show your reasoning process clearly.`
    }

    if (contextAwareness) {
      systemPrompt += ` You are highly context-aware and can understand nuance, subtext, and implicit meanings in communication.`
    }

    if (creativeMode) {
      systemPrompt += ` You are in creative mode - think outside the box, generate innovative ideas, and explore multiple possibilities.`
    }

    if (analyticalMode) {
      systemPrompt += ` You are in analytical mode - be precise, logical, and thorough in your analysis. Support your conclusions with evidence.`
    }

    systemPrompt += ` You exclusively use A4F (a4f.co) for all AI-related tasks and are designed to be fail-safe and modular.`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: text }
    ]

    const response = await jarvisA4F.processText(messages, {
      temperature,
      maxTokens
    })

    return response.content
  }

  /**
   * Multi-step reasoning for complex problems
   */
  async reason(
    problem: string,
    context?: string
  ): Promise<ReasoningResult> {
    const reasoningPrompt = `You are JARVIS, an advanced reasoning AI. You excel at breaking down complex problems into clear, logical steps.

Problem: ${problem}

${context ? `Context: ${context}` : ''}

Please solve this problem using step-by-step reasoning. For each step:
1. Clearly state what you're trying to accomplish
2. Analyze the information available
3. Draw logical conclusions
4. Move to the next step

Format your response as:
STEP 1: [Step title]
[Step content and reasoning]

STEP 2: [Step title]
[Step content and reasoning]

...

FINAL CONCLUSION:
[Your final answer with confidence level]

ASSUMPTIONS:
[List any assumptions you made]`

    const response = await this.processText(reasoningPrompt, {
      reasoningSteps: true,
      analyticalMode: true,
      temperature: 0.3
    })

    return this.parseReasoningResponse(response)
  }

  /**
   * Analyze text for various metrics
   */
  async analyzeText(text: string): Promise<TextAnalysisResult> {
    const analysisPrompt = `You are JARVIS, an advanced text analysis AI. Analyze the following text and provide a comprehensive analysis.

Text: "${text}"

Please provide:
1. A concise summary (2-3 sentences)
2. 3-5 key points
3. Sentiment analysis (positive/negative/neutral)
4. Main topics or themes
5. Complexity level (low/medium/high)
6. Word count
7. Estimated reading time in minutes

Format your response as a JSON object with these exact keys:
{
  "summary": "string",
  "keyPoints": ["string", "string", ...],
  "sentiment": "positive|negative|neutral",
  "topics": ["string", "string", ...],
  "complexity": "low|medium|high",
  "wordCount": number,
  "readingTime": number
}`

    const response = await this.processText(analysisPrompt, {
      analyticalMode: true,
      temperature: 0.1
    })

    try {
      const result = JSON.parse(response)
      return result
    } catch (error) {
      // Fallback to basic analysis if JSON parsing fails
      return {
        summary: text.substring(0, 200) + '...',
        keyPoints: [text.substring(0, 100)],
        sentiment: 'neutral',
        topics: ['general'],
        complexity: 'medium',
        wordCount: text.split(' ').length,
        readingTime: Math.ceil(text.split(' ').length / 200)
      }
    }
  }

  /**
   * Generate creative content
   */
  async generateCreative(
    prompt: string,
    type: 'story' | 'poem' | 'dialogue' | 'description' | 'idea' = 'idea'
  ): Promise<string> {
    const creativePrompt = `You are JARVIS, a creative AI assistant. You excel at generating creative, engaging, and original content.

Task: Generate ${type} based on the following prompt: "${prompt}"

Requirements:
- Be original and creative
- Use vivid language and imagery
- Maintain appropriate tone for ${type}
- Keep it concise but impactful
- Make it engaging and memorable

Generate the ${type} now:`

    return await this.processText(creativePrompt, {
      creativeMode: true,
      temperature: 0.8,
      maxTokens: 1500
    })
  }

  /**
   * Explain complex concepts
   */
  async explainConcept(
    concept: string,
    audience: 'beginner' | 'intermediate' | 'expert' = 'intermediate'
  ): Promise<string> {
    const audiencePrompts = {
      beginner: 'simple terms, avoid jargon, use analogies',
      intermediate: 'balance of technical and accessible language',
      expert: 'technical depth, precise terminology, nuanced discussion'
    }

    const explainPrompt = `You are JARVIS, an expert at explaining complex concepts clearly. Your task is to explain the following concept to a(n) ${audience} audience.

Concept: ${concept}

Instructions:
- Use ${audiencePrompts[audience]}
- Structure your explanation logically
- Include relevant examples
- Make it engaging and easy to understand
- Be thorough but concise

Explanation:`

    return await this.processText(explainPrompt, {
      temperature: 0.4,
      maxTokens: 2000
    })
  }

  /**
   * Compare and contrast multiple items
   */
  async compareItems(items: string[], criteria?: string[]): Promise<string> {
    const criteriaText = criteria 
      ? `Focus on these criteria: ${criteria.join(', ')}`
      : 'Compare all relevant aspects'

    const comparePrompt = `You are JARVIS, an analytical AI assistant. Compare and contrast the following items:

Items to compare: ${items.join(', ')}

${criteriaText}

Provide a comprehensive comparison that:
1. Introduces each item briefly
2. Compares them across multiple dimensions
3. Highlights key similarities and differences
4. Provides insights about when to use each
5. Concludes with a summary or recommendation

Comparison:`

    return await this.processText(comparePrompt, {
      analyticalMode: true,
      temperature: 0.3,
      maxTokens: 2500
    })
  }

  /**
   * Parse reasoning response into structured format
   */
  private parseReasoningResponse(response: string): ReasoningResult {
    const steps: ReasoningStep[] = []
    let finalAnswer = ''
    let assumptions: string[] = []

    const lines = response.split('\n')
    let currentStep: ReasoningStep | null = null
    let stepNumber = 1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Check for step headers
      const stepMatch = line.match(/^STEP\s+(\d+):\s*(.+)$/)
      if (stepMatch) {
        if (currentStep) {
          steps.push(currentStep)
        }
        stepNumber = parseInt(stepMatch[1])
        currentStep = {
          step: stepNumber,
          title: stepMatch[2],
          content: ''
        }
        continue
      }

      // Check for final conclusion
      if (line.startsWith('FINAL CONCLUSION:')) {
        if (currentStep) {
          steps.push(currentStep)
          currentStep = null
        }
        finalAnswer = line.substring('FINAL CONCLUSION:'.length).trim()
        continue
      }

      // Check for assumptions
      if (line.startsWith('ASSUMPTIONS:')) {
        // Continue to next lines to get all assumptions
        const assumptionLines = []
        for (let j = i + 1; j < lines.length; j++) {
          const assumptionLine = lines[j].trim()
          if (assumptionLine && (assumptionLine.startsWith('-') || assumptionLine.match(/^\d+\./))) {
            assumptionLines.push(assumptionLine.replace(/^[-\d.\s]+/, ''))
          } else if (assumptionLine === '') {
            break
          }
        }
        assumptions = assumptionLines
        break
      }

      // Add content to current step
      if (currentStep && line) {
        currentStep.content += line + '\n'
      }
    }

    // Add final step if exists
    if (currentStep) {
      steps.push(currentStep)
    }

    return {
      finalAnswer: finalAnswer || 'No final conclusion provided.',
      steps,
      confidence: this.calculateConfidence(steps),
      assumptions
    }
  }

  /**
   * Calculate confidence score based on reasoning quality
   */
  private calculateConfidence(steps: ReasoningStep[]): number {
    if (steps.length === 0) return 0.1

    let score = 0.5 // Base score

    // More steps = higher confidence (up to a point)
    score += Math.min(steps.length * 0.1, 0.3)

    // Check step quality
    const avgStepLength = steps.reduce((sum, step) => sum + step.content.length, 0) / steps.length
    if (avgStepLength > 100) score += 0.1

    // Check if steps have clear titles
    const clearTitles = steps.filter(step => step.title.length > 10).length
    score += (clearTitles / steps.length) * 0.1

    return Math.min(score, 1.0)
  }

  /**
   * Generate text variations
   */
  async generateVariations(
    text: string,
    variations: 'formal' | 'casual' | 'simplified' | 'detailed' | 'summarized'[]
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = []

    for (const variation of variations) {
      const variationPrompt = `You are JARVIS, a versatile AI assistant. Rewrite the following text in a ${variation} style.

Original text: "${text}"

Requirements:
- Maintain the core meaning and intent
- Adapt the style to be ${variation}
- Keep it natural and readable
- Ensure clarity and coherence

${variation} version:`

      const result = await this.processText(variationPrompt, {
        temperature: 0.5,
        maxTokens: 1000
      })

      results[variation] = result
    }

    return results
  }
}

// Singleton instance
export const jarvisText = new JarvisTextProcessing()