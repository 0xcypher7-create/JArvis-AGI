#!/usr/bin/env node

import { JarvisService } from './services/JarvisService';
import { Logger } from './utils/Logger';
import { ConfigManager } from './utils/ConfigManager';
import { SystemManager } from './managers/SystemManager';

async function main() {
  try {
    // Initialize logger
    const logger = new Logger();
    logger.info('Starting JARVIS Background Service...');

    // Initialize configuration
    const config = new ConfigManager();
    await config.load();

    // Initialize system manager
    const systemManager = new SystemManager(config, logger);

    // Initialize JARVIS service
    const jarvisService = new JarvisService(config, logger, systemManager);
    
    // Start the service
    await jarvisService.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await jarvisService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await jarvisService.stop();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      jarvisService.stop().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    logger.info('JARVIS Background Service started successfully');
    logger.info('Say "JARVIS" to wake me up!');

  } catch (error) {
    console.error('Failed to start JARVIS service:', error);
    process.exit(1);
  }
}

// Start the service
main();