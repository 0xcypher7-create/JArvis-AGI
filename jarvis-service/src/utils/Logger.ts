import winston from 'winston';
import path from 'path';

export class Logger {
  private logger: winston.Logger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logDir = process.env.LOG_DIR || './logs';

    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level}]: ${stack || message}`;
      })
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: consoleFormat,
        level: logLevel
      })
    ];

    // Add file transport if logToFile is enabled
    if (process.env.LOG_TO_FILE !== 'false') {
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          format: logFormat,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        })
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: false
    });
  }

  info(message: string, ...args: any[]): void {
    this.logger.info(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.logger.error(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }

  verbose(message: string, ...args: any[]): void {
    this.logger.verbose(message, ...args);
  }
}