const timestamp = () => new Date().toISOString();

export const logger = {
  info: (...args) => console.log(`[${timestamp()}] [info]`, ...args),
  error: (...args) => console.error(`[${timestamp()}] [error]`, ...args),
};
