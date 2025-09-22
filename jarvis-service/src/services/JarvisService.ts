import { Logger } from '../utils/Logger';
import { ConfigManager, JarvisConfig } from '../utils/ConfigManager';
import { SystemManager } from '../managers/SystemManager';
import { AudioManager } from '../managers/AudioManager';
import { WakeWordDetector } from '../managers/WakeWordDetector';
import { AIService } from './AIService';

export class JarvisService {
  private config: JarvisConfig;
  private logger: Logger;
  private systemManager: SystemManager;
  private audioManager: AudioManager;
  private wakeWordDetector: WakeWordDetector;
  private aiService: AIService;
  private isRunning: boolean = false;
  private isActive: boolean = false;
  private isShuttingDown: boolean = false;
  private commandTimeout: NodeJS.Timeout | null = null;
  private shutdownTimeout: NodeJS.Timeout | null = null;
  private emergencyShutdown: boolean = false;

  constructor(config: ConfigManager, logger: Logger, systemManager: SystemManager) {
    this.config = config.getConfig();
    this.logger = logger;
    this.systemManager = systemManager;
    
    // Initialize managers
    this.audioManager = new AudioManager(config, logger);
    this.wakeWordDetector = new WakeWordDetector(config, logger, this.audioManager);
    this.aiService = new AIService(config, logger);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('JARVIS service is already running');
      return;
    }

    if (this.isShuttingDown) {
      this.logger.warn('JARVIS service is shutting down, cannot start');
      return;
    }

    try {
      this.logger.info('Starting JARVIS service...');
      this.emergencyShutdown = false;

      // Initialize AI service
      await this.aiService.initialize();

      // Set up wake word detection
      this.wakeWordDetector.onWakeWordDetected(this.handleWakeWordDetected.bind(this));

      // Start wake word detection
      await this.wakeWordDetector.startDetection();

      this.isRunning = true;
      this.logger.info('JARVIS service started successfully');
      this.logger.info(`Wake word: "${this.config.jarvis.wakeWord}"`);
      this.logger.info('Say the wake word to activate JARVIS!');
      this.logger.info('To shutdown safely, say: "JARVIS shutdown"');

    } catch (error) {
      this.logger.error('Failed to start JARVIS service:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning || this.isShuttingDown) {
      return;
    }

    try {
      this.logger.info('Stopping JARVIS service...');
      this.isShuttingDown = true;

      // Set shutdown timeout to prevent hanging
      this.shutdownTimeout = setTimeout(() => {
        this.logger.warn('Shutdown timeout reached, forcing emergency shutdown');
        this.emergencyShutdown = true;
        this.forceShutdown();
      }, 30000); // 30 seconds timeout

      // Stop wake word detection
      try {
        await this.wakeWordDetector.stopDetection();
      } catch (error) {
        this.logger.warn('Error stopping wake word detection:', error);
      }

      // Clear any active command timeout
      if (this.commandTimeout) {
        clearTimeout(this.commandTimeout);
        this.commandTimeout = null;
      }

      // Stop audio manager if it's listening
      try {
        if (this.audioManager.isCurrentlyListening()) {
          await this.audioManager.stopListening();
        }
      } catch (error) {
        this.logger.warn('Error stopping audio manager:', error);
      }

      // Clear shutdown timeout
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
        this.shutdownTimeout = null;
      }

      this.isRunning = false;
      this.isActive = false;
      this.isShuttingDown = false;
      this.logger.info('JARVIS service stopped successfully');

    } catch (error) {
      this.logger.error('Failed to stop JARVIS service:', error);
      // Force shutdown even if there's an error
      this.forceShutdown();
      throw error;
    }
  }

  private forceShutdown(): void {
    this.logger.warn('Forcing emergency shutdown...');
    this.isRunning = false;
    this.isActive = false;
    this.isShuttingDown = false;
    
    // Clear all timeouts
    if (this.commandTimeout) {
      clearTimeout(this.commandTimeout);
      this.commandTimeout = null;
    }
    
    if (this.shutdownTimeout) {
      clearTimeout(this.shutdownTimeout);
      this.shutdownTimeout = null;
    }
    
    this.logger.info('Emergency shutdown completed');
  }

  async emergencyStop(): Promise<void> {
    this.logger.warn('Emergency stop initiated');
    this.emergencyShutdown = true;
    this.forceShutdown();
  }

  private async handleWakeWordDetected(): Promise<void> {
    if (this.isActive) {
      this.logger.debug('Already active, ignoring wake word');
      return;
    }

    if (this.isShuttingDown || this.emergencyShutdown) {
      this.logger.debug('Service is shutting down, ignoring wake word');
      return;
    }

    try {
      this.logger.info('Wake word detected, activating JARVIS...');
      this.isActive = true;

      // Play activation sound or response
      await this.respond('Yes? How can I help you?');

      // Start listening for commands
      await this.listenForCommands();

    } catch (error) {
      this.logger.error('Error handling wake word detection:', error);
      this.isActive = false;
    }
  }

  private async listenForCommands(): Promise<void> {
    try {
      if (this.isShuttingDown || this.emergencyShutdown) {
        this.logger.debug('Service is shutting down, not listening for commands');
        this.isActive = false;
        return;
      }

      this.logger.info('Listening for commands...');

      // Set command timeout
      this.commandTimeout = setTimeout(() => {
        this.logger.info('Command listening timeout reached');
        this.isActive = false;
      }, this.config.jarvis.listeningTimeout);

      // Record audio for command
      const audioBuffer = await this.audioManager.recordAudio(this.config.jarvis.listeningTimeout);

      // Clear command timeout
      if (this.commandTimeout) {
        clearTimeout(this.commandTimeout);
        this.commandTimeout = null;
      }

      // Convert audio to text (simplified - in production, use speech-to-text service)
      const command = await this.audioToText(audioBuffer);

      if (command && command.trim()) {
        this.logger.info(`Command received: ${command}`);
        await this.processCommand(command);
      } else {
        this.logger.info('No command detected');
        await this.respond('I didn\'t hear a command. Please try again.');
      }

    } catch (error) {
      this.logger.error('Error listening for commands:', error);
      await this.respond('I apologize, but I encountered an error. Please try again.');
    } finally {
      this.isActive = false;
    }
  }

  private async audioToText(audioBuffer: Buffer): Promise<string> {
    try {
      // This is a simplified version
      // In production, you would use:
      // - Google Speech-to-Text
      // - Amazon Transcribe
      // - Azure Speech Services
      // - OpenAI Whisper
      
      // For now, we'll simulate speech recognition
      this.logger.debug('Converting audio to text (simulated)');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a mock command for testing
      // In production, this would return the actual transcribed text
      return 'what time is it';
      
    } catch (error) {
      this.logger.error('Error converting audio to text:', error);
      throw error;
    }
  }

  private async processCommand(command: string): Promise<void> {
    if (this.isShuttingDown || this.emergencyShutdown) {
      this.logger.debug('Service is shutting down, not processing command');
      return;
    }

    try {
      this.logger.info(`Processing command: ${command}`);

      // Check for shutdown commands
      const lowerCommand = command.toLowerCase();
      if (this.isShutdownCommand(lowerCommand)) {
        await this.handleShutdownCommand(command);
        return;
      }

      // Check for emergency stop commands
      if (this.isEmergencyStopCommand(lowerCommand)) {
        await this.handleEmergencyStop();
        return;
      }

      // Get system context
      const systemInfo = await this.systemManager.getSystemInfo();

      // Process command with AI
      const response = await this.aiService.processCommand(command, {
        systemInfo,
        timestamp: new Date().toISOString(),
        isActive: this.isActive
      });

      // Respond to user
      await this.respond(response);

      // Execute any system commands if needed
      await this.executeSystemCommand(command, response);

    } catch (error) {
      this.logger.error('Error processing command:', error);
      await this.respond('I apologize, but I encountered an error while processing your command.');
    }
  }

  private isShutdownCommand(command: string): boolean {
    const shutdownPhrases = [
      'shutdown',
      'power off',
      'turn off',
      'exit',
      'quit',
      'stop jarvis',
      'jarvis shutdown',
      'jarvis stop',
      'jarvis exit'
    ];
    
    return shutdownPhrases.some(phrase => command.includes(phrase));
  }

  private isEmergencyStopCommand(command: string): boolean {
    const emergencyPhrases = [
      'emergency stop',
      'emergency shutdown',
      'force stop',
      'abort',
      'jarvis emergency'
    ];
    
    return emergencyPhrases.some(phrase => command.includes(phrase));
  }

  private async handleShutdownCommand(command: string): Promise<void> {
    this.logger.info('Shutdown command detected');
    
    if (command.toLowerCase().includes('jarvis')) {
      await this.respond('Shutting down JARVIS service. Goodbye!');
      await this.stop();
    } else {
      await this.respond('To shutdown JARVIS, please say "JARVIS shutdown"');
    }
  }

  private async handleEmergencyStop(): Promise<void> {
    this.logger.warn('Emergency stop command detected');
    await this.respond('Emergency shutdown initiated!');
    await this.emergencyStop();
  }

  private async executeSystemCommand(command: string, aiResponse: string): Promise<void> {
    try {
      // Check if the AI response contains system commands
      const systemCommands = this.extractSystemCommands(aiResponse);
      
      for (const sysCommand of systemCommands) {
        if (this.config.system.allowedCommands.includes(sysCommand.type)) {
          await this.systemManager.executeCommand(sysCommand.command, sysCommand.args);
        }
      }
    } catch (error) {
      this.logger.error('Error executing system command:', error);
    }
  }

  private extractSystemCommands(response: string): any[] {
    // Extract system commands from AI response
    // This is a simplified version - in production, you'd use more sophisticated parsing
    const commands: any[] = [];
    
    // Example: if response contains "I'll get the system time for you"
    if (response.includes('system time') || response.includes('current time')) {
      commands.push({
        type: 'system.info',
        command: 'date',
        args: []
      });
    }
    
    // Add more command extraction logic as needed
    
    return commands;
  }

  private async respond(message: string): Promise<void> {
    try {
      this.logger.info(`Responding: ${message}`);

      // Convert text to speech (simplified)
      const audioBuffer = await this.textToAudio(message);

      // Play audio response
      await this.audioManager.playAudio(audioBuffer);

    } catch (error) {
      this.logger.error('Error responding:', error);
      // Fallback to console output
      console.log(`JARVIS: ${message}`);
    }
  }

  private async textToAudio(text: string): Promise<Buffer> {
    try {
      // This is a simplified version
      // In production, you would use:
      // - Google Text-to-Speech
      // - Amazon Polly
      // - Azure Speech Services
      // - OpenAI TTS
      
      this.logger.debug('Converting text to audio (simulated)');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return a mock audio buffer
      // In production, this would return actual audio data
      return Buffer.alloc(1000); // Empty buffer for simulation
      
    } catch (error) {
      this.logger.error('Error converting text to audio:', error);
      throw error;
    }
  }

  getStatus(): any {
    return {
      isRunning: this.isRunning,
      isActive: this.isActive,
      isShuttingDown: this.isShuttingDown,
      emergencyShutdown: this.emergencyShutdown,
      wakeWordDetector: this.wakeWordDetector.isDetecting(),
      aiService: this.aiService.isInitialized(),
      audioManager: this.audioManager.isCurrentlyListening()
    };
  }
}