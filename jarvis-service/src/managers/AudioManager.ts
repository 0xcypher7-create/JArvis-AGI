import * as record from 'node-record-lpcm16';
import { Speaker } from 'speaker';
import fs from 'fs';
import path from 'path';

import { Logger } from '../utils/Logger';
import { ConfigManager, JarvisConfig } from '../utils/ConfigManager';

export class AudioManager {
  private config: JarvisConfig;
  private logger: Logger;
  private isListening: boolean = false;
  private recording: any = null;
  private speaker: Speaker | null = null;

  constructor(config: ConfigManager, logger: Logger) {
    this.config = config.getConfig();
    this.logger = logger;
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      this.logger.warn('Already listening');
      return;
    }

    try {
      this.logger.info('Starting audio listening...');
      this.isListening = true;

      // Start recording
      this.recording = record.record({
        sampleRate: this.config.audio.sampleRate,
        channels: this.config.audio.channels,
        threshold: this.config.audio.silenceThreshold,
        silence: this.config.audio.silenceDuration,
        verbose: false
      });

      this.logger.info('Audio listening started');
    } catch (error) {
      this.logger.error('Failed to start audio listening:', error);
      this.isListening = false;
      throw error;
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      this.logger.info('Stopping audio listening...');
      
      if (this.recording) {
        this.recording.stop();
        this.recording = null;
      }

      this.isListening = false;
      this.logger.info('Audio listening stopped');
    } catch (error) {
      this.logger.error('Failed to stop audio listening:', error);
      throw error;
    }
  }

  async recordAudio(timeout: number = 10000): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let timeoutId: NodeJS.Timeout;

      try {
        this.logger.info(`Recording audio for ${timeout}ms...`);

        const recording = record.record({
          sampleRate: this.config.audio.sampleRate,
          channels: this.config.audio.channels,
          threshold: this.config.audio.silenceThreshold,
          silence: this.config.audio.silenceDuration,
          verbose: false
        });

        recording.stream().on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        recording.stream().on('error', (error: Error) => {
          clearTimeout(timeoutId);
          recording.stop();
          reject(error);
        });

        recording.stream().on('end', () => {
          clearTimeout(timeoutId);
          const audioBuffer = Buffer.concat(chunks);
          this.logger.info(`Audio recording completed, size: ${audioBuffer.length} bytes`);
          resolve(audioBuffer);
        });

        // Set timeout
        timeoutId = setTimeout(() => {
          this.logger.info('Recording timeout reached');
          recording.stop();
        }, timeout);

      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  async playAudio(audioBuffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.logger.info('Playing audio response...');

        this.speaker = new Speaker({
          sampleRate: this.config.audio.sampleRate,
          channels: this.config.audio.channels,
          bitDepth: this.config.audio.bitDepth
        });

        this.speaker.on('error', (error) => {
          this.logger.error('Audio playback error:', error);
          reject(error);
        });

        this.speaker.on('close', () => {
          this.logger.info('Audio playback completed');
          resolve();
        });

        this.speaker.write(audioBuffer);
        this.speaker.end();

      } catch (error) {
        this.logger.error('Failed to play audio:', error);
        reject(error);
      }
    });
  }

  async saveAudioToFile(audioBuffer: Buffer, filename: string): Promise<string> {
    try {
      const filePath = path.join(process.cwd(), 'temp', filename);
      
      // Create temp directory if it doesn't exist
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      
      await fs.promises.writeFile(filePath, audioBuffer);
      this.logger.info(`Audio saved to file: ${filePath}`);
      
      return filePath;
    } catch (error) {
      this.logger.error('Failed to save audio to file:', error);
      throw error;
    }
  }

  async loadAudioFromFile(filePath: string): Promise<Buffer> {
    try {
      const audioBuffer = await fs.promises.readFile(filePath);
      this.logger.info(`Audio loaded from file: ${filePath}`);
      return audioBuffer;
    } catch (error) {
      this.logger.error('Failed to load audio from file:', error);
      throw error;
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  getAudioConfig(): any {
    return {
      sampleRate: this.config.audio.sampleRate,
      channels: this.config.audio.channels,
      bitDepth: this.config.audio.bitDepth,
      encoding: this.config.audio.encoding,
      silenceThreshold: this.config.audio.silenceThreshold,
      silenceDuration: this.config.audio.silenceDuration
    };
  }
}