import { createLogger, format, transports } from 'winston';
import config from '@/config';

const transportDev = () =>
  new transports.Console({
    format: format.prettyPrint({ colorize: true }),
    handleExceptions: true,
  });

const transportProd = () => new transports.Console({
  handleExceptions: true,
});

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.splat(), format.json()),
  defaultMeta: { service: 'line-auth-demo' },
});

if (config.environment !== 'production') {
  logger.add(
    transportDev(),
  )
} else {
  logger.add(
    transportProd()
  )
}

export default logger;
