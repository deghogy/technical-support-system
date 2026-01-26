import pino from 'pino'

/**
 * Structured logger using Pino
 * In development, uses pretty output. In production, uses JSON format.
 */
const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  pino.transport(
    process.env.NODE_ENV === 'production'
      ? undefined // JSON output in production
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
  )
)

export default logger
