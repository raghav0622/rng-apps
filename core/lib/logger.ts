/* eslint-disable no-console */

export const logInfo = (message: string, metadata: Record<string, unknown> = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.info(`ℹ️ [INFO]: ${message}`, metadata);
  }
};

export const logError = (message: string, metadata: Record<string, unknown> = {}) => {
  console.error(`🚨 [ERROR]: ${message}`, metadata);
};

export const logDebug = (message: string, metadata: Record<string, unknown> = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`🐛 [DEBUG]: ${message}`, metadata);
  }
};
