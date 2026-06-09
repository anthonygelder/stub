type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  [key: string]: any;
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, meta?: Record<string, any>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  const output = formatEntry(entry);
  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else console.log(output);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, any>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, any>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, any>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, any>) => log('error', msg, meta),
};
