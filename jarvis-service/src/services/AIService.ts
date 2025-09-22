import ZAI from 'z-ai-web-dev-sdk';
import { Logger } from '../utils/Logger';
import { ConfigManager, JarvisConfig } from '../utils/ConfigManager';

export class AIService {
  private config: JarvisConfig;
  private logger: Logger;
  private zai: any = null;
  private conversationHistory: any[] = [];

  constructor(config: ConfigManager, logger: Logger) {
    this.config = config.getConfig();
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing AI service...');
      
      this.zai = await ZAI.create();
      
      this.logger.info('AI service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AI service:', error);
      throw error;
    }
  }

  async processCommand(command: string, context: any = {}): Promise<string> {
    try {
      this.logger.info(`Processing command: ${command}`);

      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      // Prepare messages
      const messages = [
        {
          role: 'system',
          content: this.config.ai.systemPrompt
        }
      ];

      // Add conversation history if enabled
      if (this.config.ai.enableMemory && this.conversationHistory.length > 0) {
        messages.push(...this.conversationHistory);
      }

      // Add user command
      messages.push({
        role: 'user',
        content: command
      });

      // Add context if provided
      if (Object.keys(context).length > 0) {
        messages.push({
          role: 'user',
          content: `Context: ${JSON.stringify(context)}`
        });
      }

      // Get AI response
      const completion = await this.zai.chat.completions.create({
        messages,
        temperature: this.config.ai.temperature,
        max_tokens: this.config.ai.maxTokens
      });

      const response = completion.choices[0]?.message?.content || 
                     'I apologize, but I was unable to generate a response.';

      // Add to conversation history
      if (this.config.ai.enableMemory) {
        this.conversationHistory.push(
          { role: 'user', content: command },
          { role: 'assistant', content: response }
        );

        // Limit conversation history
        if (this.conversationHistory.length > this.config.ai.memoryRetention * 2) {
          this.conversationHistory = this.conversationHistory.slice(-this.config.ai.memoryRetention * 2);
        }
      }

      this.logger.info(`AI response generated: ${response.substring(0, 100)}...`);
      return response;

    } catch (error) {
      this.logger.error('Failed to process command:', error);
      return 'I apologize, but I encountered an error while processing your command. Please try again.';
    }
  }

  async generateImage(prompt: string, size: string = '1024x1024'): Promise<string> {
    try {
      this.logger.info(`Generating image with prompt: ${prompt}`);

      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      const response = await this.zai.images.generations.create({
        prompt,
        size
      });

      const imageData = response.data[0]?.base64;
      
      if (!imageData) {
        throw new Error('No image data received from AI service');
      }

      this.logger.info('Image generated successfully');
      return imageData;

    } catch (error) {
      this.logger.error('Failed to generate image:', error);
      throw error;
    }
  }

  async searchWeb(query: string, numResults: number = 10): Promise<any[]> {
    try {
      this.logger.info(`Searching web for: ${query}`);

      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      const searchResult = await this.zai.functions.invoke('web_search', {
        query,
        num: numResults
      });

      this.logger.info(`Web search completed, found ${searchResult.length} results`);
      return searchResult;

    } catch (error) {
      this.logger.error('Failed to search web:', error);
      throw error;
    }
  }

  async analyzeText(text: string, analysisType: string = 'general'): Promise<any> {
    try {
      this.logger.info(`Analyzing text with type: ${analysisType}`);

      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      const prompt = `Please analyze the following text and provide ${analysisType} analysis:\n\n${text}`;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a text analysis expert. Provide detailed, accurate analysis based on the requested analysis type.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = completion.choices[0]?.message?.content || 
                     'I apologize, but I was unable to analyze the text.';

      this.logger.info('Text analysis completed');
      return {
        type: analysisType,
        analysis,
        textLength: text.length
      };

    } catch (error) {
      this.logger.error('Failed to analyze text:', error);
      throw error;
    }
  }

  clearConversationHistory(): void {
    this.conversationHistory = [];
    this.logger.info('Conversation history cleared');
  }

  getConversationHistory(): any[] {
    return [...this.conversationHistory];
  }

  isInitialized(): boolean {
    return this.zai !== null;
  }
}