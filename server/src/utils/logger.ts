import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

const writeToFile = (level: LogLevel, message: string) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  const logFile = path.join(logDir, `${level}.log`);
  fs.appendFileSync(logFile, logEntry);
  // Also write to combined log
  fs.appendFileSync(path.join(logDir, 'combined.log'), logEntry);
};

const logger = {
  info: (message: string, ...args: any[]) => {
    if (logLevels[currentLevel] <= logLevels.info) {
      console.log(`[INFO] ${message}`, ...args);
      writeToFile('info', message);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (logLevels[currentLevel] <= logLevels.warn) {
      console.warn(`[WARN] ${message}`, ...args);
      writeToFile('warn', message);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (logLevels[currentLevel] <= logLevels.error) {
      console.error(`[ERROR] ${message}`, ...args);
      writeToFile('error', message);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (logLevels[currentLevel] <= logLevels.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
      writeToFile('debug', message);
    }
  },
};

export default logger;