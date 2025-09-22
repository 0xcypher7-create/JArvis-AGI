import { Logger } from '../utils/Logger';
import { ConfigManager, JarvisConfig } from '../utils/ConfigManager';
import { AudioManager } from './AudioManager';

export class WakeWordDetector {
  private config: JarvisConfig;
  private logger: Logger;
  private audioManager: AudioManager;
  private isDetecting: boolean = false;
  private wakeWordCallbacks: ((detected: boolean) => void)[] = [];

  constructor(config: ConfigManager, logger: Logger, audioManager: AudioManager) {
    this.config = config.getConfig();
    this.logger = logger;
    this.audioManager = audioManager;
  }

  async startDetection(): Promise<void> {
    if (this.isDetecting) {
      this.logger.warn('Wake word detection already running');
      return;
    }

    try {
      this.logger.info(`Starting wake word detection for: "${this.config.jarvis.wakeWord}"`);
      this.isDetecting = true;

      // Start continuous detection
      await this.detectWakeWord();

    } catch (error) {
      this.logger.error('Failed to start wake word detection:', error);
      this.isDetecting = false;
      throw error;
    }
  }

  async stopDetection(): Promise<void> {
    if (!this.isDetecting) {
      return;
    }

    try {
      this.logger.info('Stopping wake word detection...');
      this.isDetecting = false;
      this.logger.info('Wake word detection stopped');
    } catch (error) {
      this.logger.error('Failed to stop wake word detection:', error);
      throw error;
    }
  }

  private async detectWakeWord(): Promise<void> {
    while (this.isDetecting) {
      try {
        // Record audio for a short period
        const audioBuffer = await this.audioManager.recordAudio(2000); // 2 seconds
        
        // Simple wake word detection (in a real implementation, you'd use a proper wake word detection library)
        const detected = await this.simpleWakeWordDetection(audioBuffer);
        
        if (detected) {
          this.logger.info(`Wake word "${this.config.jarvis.wakeWord}" detected!`);
          this.notifyWakeWordDetected();
        }

        // Small delay to prevent CPU overload
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        this.logger.error('Error during wake word detection:', error);
        // Continue detection even if there's an error
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async simpleWakeWordDetection(audioBuffer: Buffer): Promise<boolean> {
    try {
      // This is a very basic wake word detection
      // In a production environment, you would use:
      // - Porcupine (from Picovoice)
      // - Snowboy
      // - Custom ML model
      // - Google's Speech-to-Text with wake word detection
      
      // For now, we'll use a simple energy-based detection
      // This will trigger on any loud speech, not specifically "jarvis"
      
      const samples = audioBuffer.length / 2; // 16-bit audio
      let energy = 0;
      
      for (let i = 0; i < audioBuffer.length; i += 2) {
        const sample = audioBuffer.readInt16LE(i);
        energy += sample * sample;
      }
      
      const averageEnergy = energy / samples;
      const threshold = this.config.jarvis.wakeWordSensitivity * 1000000; // Adjust based on testing
      
      return averageEnergy > threshold;
      
    } catch (error) {
      this.logger.error('Error in wake word detection:', error);
      return false;
    }
  }

  private notifyWakeWordDetected(): void {
    this.wakeWordCallbacks.forEach(callback => {
      try {
        callback(true);
      } catch (error) {
        this.logger.error('Error in wake word callback:', error);
      }
    });
  }

  onWakeWordDetected(callback: (detected: boolean) => void): void {
    this.wakeWordCallbacks.push(callback);
  }

  removeWakeWordCallback(callback: (detected: boolean) => void): void {
    const index = this.wakeWordCallbacks.indexOf(callback);
    if (index > -1) {
      this.wakeWordCallbacks.splice(index, 1);
    }
  }

  isDetecting(): boolean {
    return this.isDetecting;
  }
}