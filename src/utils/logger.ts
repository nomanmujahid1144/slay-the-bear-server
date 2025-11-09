import fs from 'fs';
import path from 'path';
import config from '../config';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
}

class Logger {
  private logToFile(entry: LogEntry): void {
    const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    const logLine = `${JSON.stringify(entry)}\n`;
    
    fs.appendFileSync(logFile, logLine, 'utf8');
  }

  private formatLog(level: LogLevel, message: string, meta?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
    };

    // Log to console in development
    if (config.NODE_ENV === 'development') {
      const emoji = {
        INFO: '📝',
        WARN: '⚠️',
        ERROR: '❌',
        DEBUG: '🔍',
      }[level];

      console.log(`${emoji} [${entry.timestamp}] [${level}] ${message}`, meta || '');
    }

    // Always log to file
    this.logToFile(entry);
  }

  info(message: string, meta?: any): void {
    this.formatLog('INFO', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.formatLog('WARN', message, meta);
  }

  error(message: string, meta?: any): void {
    this.formatLog('ERROR', message, meta);
  }

  debug(message: string, meta?: any): void {
    if (config.NODE_ENV === 'development') {
      this.formatLog('DEBUG', message, meta);
    }
  }

  // Log HTTP requests
  request(method: string, path: string, ip: string, statusCode?: number): void {
    this.info(`${method} ${path}`, {
      ip,
      statusCode,
      userAgent: 'HTTP Request',
    });
  }
}

export const logger = new Logger();