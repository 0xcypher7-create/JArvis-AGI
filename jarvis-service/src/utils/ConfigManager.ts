import fs from 'fs/promises';
import path from 'path';

export interface JarvisConfig {
  jarvis: {
    name: string;
    wakeWord: string;
    wakeWordSensitivity: number;
    listeningTimeout: number;
    responseTimeout: number;
    maxResponseLength: number;
    language: string;
  };
  audio: {
    sampleRate: number;
    channels: number;
    bitDepth: number;
    encoding: string;
    silenceThreshold: number;
    silenceDuration: number;
  };
  system: {
    logLevel: string;
    enableSystemAccess: boolean;
    allowedCommands: string[];
    maxCommandLength: number;
  };
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    enableMemory: boolean;
    memoryRetention: number;
  };
  logging: {
    level: string;
    maxFiles: number;
    maxSize: string;
    logToFile: boolean;
    logToConsole: boolean;
    logDir: string;
  };
}

export class ConfigManager {
  private config: JarvisConfig | null = null;
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'jarvis.json');
  }

  async load(): Promise<JarvisConfig> {
    try {
      // Load configuration file
      const configData = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
      
      // Override with environment variables
      this.config = this.mergeWithEnvVars(this.config);
      
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }

  private mergeWithEnvVars(config: JarvisConfig): JarvisConfig {
    const envConfig = { ...config };

    // Override audio settings
    if (process.env.AUDIO_SAMPLE_RATE) {
      envConfig.audio.sampleRate = parseInt(process.env.AUDIO_SAMPLE_RATE);
    }
    if (process.env.AUDIO_CHANNELS) {
      envConfig.audio.channels = parseInt(process.env.AUDIO_CHANNELS);
    }

    // Override system settings
    if (process.env.ENABLE_SYSTEM_ACCESS) {
      envConfig.system.enableSystemAccess = process.env.ENABLE_SYSTEM_ACCESS === 'true';
    }
    if (process.env.MAX_COMMAND_LENGTH) {
      envConfig.system.maxCommandLength = parseInt(process.env.MAX_COMMAND_LENGTH);
    }

    // Override AI settings
    if (process.env.ZAI_API_KEY) {
      // This will be used by the AI service
    }

    // Override logging settings
    if (process.env.LOG_LEVEL) {
      envConfig.logging.level = process.env.LOG_LEVEL;
    }
    if (process.env.LOG_DIR) {
      envConfig.logging.logDir = process.env.LOG_DIR;
    }

    return envConfig;
  }

  getConfig(): JarvisConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config;
  }

  async reload(): Promise<JarvisConfig> {
    return await this.load();
  }
}