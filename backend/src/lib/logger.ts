type LogLevel = 'info' | 'warn' | 'error'

type LogFields = Record<string, unknown>

function log(level: LogLevel, msg: string, fields?: LogFields): void {
  const entry = JSON.stringify({ level, time: new Date().toISOString(), msg, ...fields })
  if (level === 'error') {
    console.error(entry)
  } else {
    console.log(entry)
  }
}

export const logger = {
  info: (msg: string, fields?: LogFields) => log('info', msg, fields),
  warn: (msg: string, fields?: LogFields) => log('warn', msg, fields),
  error: (msg: string, fields?: LogFields) => log('error', msg, fields),
}
