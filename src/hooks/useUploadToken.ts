import { usePluginBridge } from '@teable/sdk';
import { setAuthToken } from '@/lib/api';
import { useCallback } from 'react';

/**
 * Interface for temporary token response from Teable plugin bridge
 */
interface IGetTempTokenVo {
  accessToken: string;
  expiresTime: string;
}

/**
 * Hook to provide token management for file upload operations.
 * This hook gets a fresh token for each upload operation without caching.
 *
 * Features:
 * - Gets fresh token before each upload operation
 * - No caching - always gets the latest token
 * - Handles token refresh failures gracefully
 */
export function useUploadToken() {
  const bridge = usePluginBridge();

  /**
   * Gets a fresh temporary token for upload operations.
   * Always fetches a new token without any caching.
   *
   * @returns {Promise<string | null>} Fresh access token or null if unavailable
   */
  const getFreshUploadToken = useCallback(async (): Promise<string | null> => {
    if (!bridge) {
      console.warn('Plugin bridge not available for token refresh');
      return null;
    }

    try {
      // Always fetch fresh token
      const tokenResponse: IGetTempTokenVo = await bridge.getSelfTempToken();
      const { accessToken } = tokenResponse;

      // Update global API authentication
      setAuthToken(accessToken);

      return accessToken;
    } catch (error) {
      console.error('Failed to get fresh upload token:', error);
      return null;
    }
  }, [bridge]);

  /**
   * Executes an upload operation with a fresh token.
   * This is the preferred method for performing uploads that need valid authentication.
   *
   * @param uploadFunction - Function that performs the actual upload operation
   * @returns {Promise<T>} Result of the upload function or throws error
   */
  const executeWithFreshToken = useCallback(async <T>(
    uploadFunction: (token: string) => Promise<T>
  ): Promise<T> => {
    const freshToken = await getFreshUploadToken();

    if (!freshToken) {
      throw new Error('Failed to obtain fresh authentication token for upload');
    }

    return uploadFunction(freshToken);
  }, [getFreshUploadToken]);

  return {
    getFreshUploadToken,
    executeWithFreshToken,
  };
}