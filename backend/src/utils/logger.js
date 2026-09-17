/* eslint-disable no-console */
const timestamp = () => new Date().toISOString();

const logger = {
  info: (message) => console.log(`[${timestamp()}] [INFO]  ${message}`),
  warn: (message) => console.warn(`[${timestamp()}] [WARN]  ${message}`),
  error: (message) => console.error(`[${timestamp()}] [ERROR] ${message}`),
  debug: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${timestamp()}] [DEBUG] ${message}`);
    }
  },
};

export default logger;
