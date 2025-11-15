import { useCallback } from 'react';

/**
 * 异步错误处理 Hook
 * 用于处理 Promise reject 和异步操作中的错误
 */
export function useAsyncError() {
  const handleAsyncError = useCallback((error: Error, context?: string) => {
    console.error(`Async error${context ? ` in ${context}` : ''}:`, error);

    // 这里可以添加错误上报逻辑
    // 例如: reportErrorToService(error, { context });

    // 可以触发全局错误状态
    // 例如: setErrorState({ message: error.message, context });

    // 或者显示用户友好的错误提示
    // 例如: showErrorToast('操作失败，请稍后重试');
  }, []);

  return handleAsyncError;
}

/**
 * 异步操作包装器
 * 自动捕获和处理 Promise 错误
 */
export function useAsyncOperation<T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  errorHandler?: (error: Error) => void
) {
  const handleAsyncError = useAsyncError();

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));

        if (errorHandler) {
          errorHandler(errorObj);
        } else {
          handleAsyncError(errorObj);
        }

        return null;
      }
    },
    [asyncFn, errorHandler, handleAsyncError]
  );

  return execute;
}

/**
 * 带重试机制的异步操作
 */
export function useRetryableAsyncOperation<T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
) {
  const handleAsyncError = useAsyncError();

  const executeWithRetry = useCallback(
    async (...args: Args): Promise<T | null> => {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await asyncFn(...args);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt === maxRetries) {
            handleAsyncError(lastError, `after ${maxRetries} attempts`);
            break;
          }

          // 等待指定时间后重试
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }

      return null;
    },
    [asyncFn, maxRetries, delay, handleAsyncError]
  );

  return executeWithRetry;
}