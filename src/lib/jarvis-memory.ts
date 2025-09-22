import { db } from '@/lib/db'

export interface MemoryData {
  id?: string
  userId: string
  type: 'preference' | 'fact' | 'context' | 'skill' | 'relationship'
  category?: string
  title: string
  content: string
  importance?: number
  strength?: number
}

export interface ConversationData {
  id?: string
  userId: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  module?: string
  metadata?: any
}

export interface UserPreferenceData {
  id?: string
  userId: string
  personality?: 'professional' | 'conversational' | 'technical'
  responseStyle?: 'detailed' | 'concise' | 'balanced'
  language?: string
  theme?: string
  voiceEnabled?: boolean
  autoSaveHistory?: boolean
  maxHistoryLength?: number
}

export class JarvisMemory {
  /**
   * Create or update a memory
   */
  async upsertMemory(data: MemoryData): Promise<MemoryData> {
    const memoryData = {
      userId: data.userId,
      type: data.type,
      category: data.category || null,
      title: data.title,
      content: data.content,
      importance: data.importance || 1,
      strength: data.strength || 1
    }

    if (data.id) {
      // Update existing memory
      const memory = await db.memory.update({
        where: { id: data.id },
        data: {
          ...memoryData,
          lastAccessed: new Date(),
          updatedAt: new Date()
        }
      })
      return this.formatMemory(memory)
    } else {
      // Create new memory
      const memory = await db.memory.create({
        data: memoryData
      })
      return this.formatMemory(memory)
    }
  }

  /**
   * Get memories by user and type
   */
  async getMemories(userId: string, type?: string, category?: string): Promise<MemoryData[]> {
    const where: any = { userId }
    
    if (type) {
      where.type = type
    }
    
    if (category) {
      where.category = category
    }

    const memories = await db.memory.findMany({
      where,
      orderBy: [
        { importance: 'desc' },
        { strength: 'desc' },
        { lastAccessed: 'desc' }
      ]
    })

    return memories.map(this.formatMemory)
  }

  /**
   * Get important memories (high importance and strength)
   */
  async getImportantMemories(userId: string, minImportance: number = 7): Promise<MemoryData[]> {
    const memories = await db.memory.findMany({
      where: {
        userId,
        importance: { gte: minImportance }
      },
      orderBy: [
        { importance: 'desc' },
        { strength: 'desc' }
      ]
    })

    return memories.map(this.formatMemory)
  }

  /**
   * Strengthen a memory (increase its strength)
   */
  async strengthenMemory(memoryId: string): Promise<MemoryData | null> {
    try {
      const memory = await db.memory.update({
        where: { id: memoryId },
        data: {
          strength: { increment: 1 },
          lastAccessed: new Date()
        }
      })
      
      return this.formatMemory(memory)
    } catch (error) {
      console.error('Failed to strengthen memory:', error)
      return null
    }
  }

  /**
   * Weaken a memory (decrease its strength, potentially forgetting it)
   */
  async weakenMemory(memoryId: string): Promise<MemoryData | null> {
    try {
      const memory = await db.memory.findUnique({
        where: { id: memoryId }
      })

      if (!memory) return null

      if (memory.strength <= 1) {
        // Delete memory if strength is 1 or less
        await db.memory.delete({
          where: { id: memoryId }
        })
        return null
      } else {
        // Decrease strength
        const updatedMemory = await db.memory.update({
          where: { id: memoryId },
          data: {
            strength: { decrement: 1 },
            updatedAt: new Date()
          }
        })
        
        return this.formatMemory(updatedMemory)
      }
    } catch (error) {
      console.error('Failed to weaken memory:', error)
      return null
    }
  }

  /**
   * Save conversation to history
   */
  async saveConversation(data: ConversationData): Promise<ConversationData> {
    try {
      // First, ensure the user exists
      await this.ensureUserExists(data.userId)
      
      const conversation = await db.conversation.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          role: data.role,
          content: data.content,
          module: data.module || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      })

      return this.formatConversation(conversation)
    } catch (error) {
      console.error('Failed to save conversation:', error)
      // Return the original data as fallback
      return {
        id: `temp_${Date.now()}`,
        userId: data.userId,
        sessionId: data.sessionId,
        role: data.role,
        content: data.content,
        module: data.module,
        metadata: data.metadata
      }
    }
  }

  /**
   * Ensure user exists in database
   */
  private async ensureUserExists(userId: string): Promise<void> {
    try {
      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        // Create user if doesn't exist
        await db.user.create({
          data: {
            id: userId,
            email: `${userId}@jarvis.local`, // Temporary email
            name: `JARVIS User ${userId.split('_')[1]}` // Extract number from user ID
          }
        })
      }
    } catch (error) {
      console.error('Failed to ensure user exists:', error)
      // Don't throw - let the conversation save continue
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(
    userId: string,
    sessionId?: string,
    limit: number = 50
  ): Promise<ConversationData[]> {
    const where: any = { userId }
    
    if (sessionId) {
      where.sessionId = sessionId
    }

    const conversations = await db.conversation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return conversations.map(this.formatConversation)
  }

  /**
   * Get recent conversations for context
   */
  async getRecentConversations(userId: string, limit: number = 10): Promise<ConversationData[]> {
    const conversations = await db.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return conversations.map(this.formatConversation).reverse()
  }

  /**
   * Create or update user preferences
   */
  async upsertUserPreferences(data: UserPreferenceData): Promise<UserPreferenceData> {
    const preferences = await db.userPreference.upsert({
      where: { userId: data.userId },
      update: {
        personality: data.personality,
        responseStyle: data.responseStyle,
        language: data.language,
        theme: data.theme,
        voiceEnabled: data.voiceEnabled,
        autoSaveHistory: data.autoSaveHistory,
        maxHistoryLength: data.maxHistoryLength
      },
      create: {
        userId: data.userId,
        personality: data.personality,
        responseStyle: data.responseStyle,
        language: data.language,
        theme: data.theme,
        voiceEnabled: data.voiceEnabled,
        autoSaveHistory: data.autoSaveHistory,
        maxHistoryLength: data.maxHistoryLength
      }
    })

    return this.formatUserPreferences(preferences)
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferenceData | null> {
    const preferences = await db.userPreference.findUnique({
      where: { userId }
    })

    return preferences ? this.formatUserPreferences(preferences) : null
  }

  /**
   * Search memories by content
   */
  async searchMemories(userId: string, query: string): Promise<MemoryData[]> {
    const memories = await db.memory.findMany({
      where: {
        userId,
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive' as const
            }
          },
          {
            content: {
              contains: query,
              mode: 'insensitive' as const
            }
          }
        ]
      },
      orderBy: [
        { importance: 'desc' },
        { strength: 'desc' }
      ]
    })

    return memories.map(this.formatMemory)
  }

  /**
   * Delete old conversations (cleanup)
   */
  async cleanupOldConversations(userId: string, keepLastDays: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - keepLastDays)

    const result = await db.conversation.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoffDate }
      }
    })

    return result.count
  }

  /**
   * Format memory data
   */
  private formatMemory(memory: any): MemoryData {
    return {
      id: memory.id,
      userId: memory.userId,
      type: memory.type,
      category: memory.category,
      title: memory.title,
      content: memory.content,
      importance: memory.importance,
      strength: memory.strength
    }
  }

  /**
   * Format conversation data
   */
  private formatConversation(conversation: any): ConversationData {
    return {
      id: conversation.id,
      userId: conversation.userId,
      sessionId: conversation.sessionId,
      role: conversation.role,
      content: conversation.content,
      module: conversation.module,
      metadata: conversation.metadata ? JSON.parse(conversation.metadata) : undefined
    }
  }

  /**
   * Format user preferences data
   */
  private formatUserPreferences(preferences: any): UserPreferenceData {
    return {
      id: preferences.id,
      userId: preferences.userId,
      personality: preferences.personality,
      responseStyle: preferences.responseStyle,
      language: preferences.language,
      theme: preferences.theme,
      voiceEnabled: preferences.voiceEnabled,
      autoSaveHistory: preferences.autoSaveHistory,
      maxHistoryLength: preferences.maxHistoryLength
    }
  }
}

// Singleton instance
export const jarvisMemory = new JarvisMemory()