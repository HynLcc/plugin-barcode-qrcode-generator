import { usePluginBridge } from "@teable/sdk";
import { configureApi, setAuthToken, reconfigureApi } from "@/lib/api";
import { useEffect, useState } from "react";

/**
 * Interface for temporary token response from Teable plugin bridge
 */
interface IGetTempTokenVo {
  accessToken: string;
  expiresTime: string;
}

/**
 * Interface for URL parameters provided by Teable plugin environment
 */
interface IUrlParams {
  baseId?: string;
  tableId?: string;
  viewId?: string;
  dashboardId?: string;
  recordId?: string;
  shareId?: string;
}

/**
 * Hook for initializing Teable API connection with proper authentication and configuration.
 * Sets up the API client with temporary tokens from the plugin bridge and handles
 * dynamic configuration updates based on URL parameter changes.
 *
 * Responsibilities:
 * - Configure API client with base settings
 * - Fetch and set authentication tokens from plugin bridge
 * - Listen for URL parameter changes and reconfigure API accordingly
 * - Handle initialization errors gracefully
 * - Provide loading state for the application
 *
 * @returns {boolean} Boolean indicating whether API initialization is complete
 */
export const useInitApi = () => {
  const bridge = usePluginBridge();
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    if (!bridge) {
      return;
    }

    /**
     * Initializes the API connection with proper authentication and configuration.
     * Attempts to fetch temporary tokens from the plugin bridge and sets up the API client.
     * Handles errors gracefully to prevent application hanging.
     */
    const initApi = async () => {
      try {
        // Configure API base settings first
        configureApi();

        // Fetch and set authentication token
        try {
          const tokenResponse: IGetTempTokenVo = await bridge.getSelfTempToken();
          setAuthToken(tokenResponse.accessToken);
        } catch (error) {
          console.error('Failed to get temp token:', error);
          // In development environment, continue initialization even without bridge
        }

        setIsInit(true);
      } catch (error) {
        console.error('Failed to initialize API:', error);
        setIsInit(true); // Set to true even on failure to avoid infinite loading
      }
    };

    initApi();

    /**
     * Event handler for URL parameter changes from the Teable host.
     * Reconfigures the API to ensure it has the latest host configuration.
     *
     * @param {IUrlParams} urlParams - Updated URL parameters from Teable
     */
    const handleUrlParams = (_urlParams: IUrlParams) => {
      // Reconfigure API to get the latest host configuration
      reconfigureApi();
    };

    bridge.on('syncUrlParams', handleUrlParams);

    // Cleanup function to remove event listener
    return () => {
      bridge.removeListener('syncUrlParams', handleUrlParams);
    };
  }, [bridge]);

  return isInit;
};
