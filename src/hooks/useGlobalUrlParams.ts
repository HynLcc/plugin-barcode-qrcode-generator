import { usePluginBridge } from "@teable/sdk";
import { useEffect, useState } from "react";
// import { IPageParams } from "../context/types"; // 不再使用IPageParams
import type { IUrlParams } from "../types";

// Global URL parameter state shared across all hook instances
let globalUrlParams: Partial<IUrlParams> = {};
const listeners: Set<(params: Partial<IUrlParams>) => void> = new Set();
let isBridgeListenerSet = false;

/**
 * Fallback method to parse URL parameters directly from browser window URL.
 * Used when Teable plugin bridge is not available or during initialization.
 *
 * @returns {Partial<IUrlParams>} Parsed URL parameters or empty object if parsing fails
 */
function parseUrlParamsFromWindow(): Partial<IUrlParams> {
  if (typeof window === 'undefined') return {};

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const params: any = {};

    // 转换URL参数为对象
    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }

    return params as Partial<IUrlParams>;
  } catch (error) {
    return {};
  }
}

/**
 * Hook for managing global URL parameters provided by the Teable plugin environment.
 * Provides a unified interface for accessing URL parameters with fallback mechanisms
 * and automatic updates when parameters change.
 *
 * Features:
 * - Global state management shared across all hook instances
 * - Fallback to browser URL parsing when bridge is unavailable
 * - Automatic updates when Teable URL parameters change
 * - Efficient listener pattern to prevent duplicate bridge subscriptions
 * - Graceful handling of bridge initialization timing issues
 *
 * @returns {Partial<IUrlParams>} Current URL parameters from Teable environment
 */
export const useGlobalUrlParams = (): Partial<IUrlParams> => {
  const bridge = usePluginBridge();
  const [urlParams, setUrlParams] = useState<Partial<IUrlParams>>({});

  useEffect(() => {
    // First try to parse parameters directly from browser URL as fallback
    const fallbackParams = parseUrlParamsFromWindow();
    if (Object.keys(fallbackParams).length > 0 && Object.keys(globalUrlParams).length === 0) {
      globalUrlParams = fallbackParams;
      setUrlParams(fallbackParams);
    }

    if (!bridge) {
      return;
    }

    // Set current parameters on initialization
    if (Object.keys(globalUrlParams).length > 0) {
      setUrlParams(globalUrlParams);
    }

    /**
     * Listener function for URL parameter changes.
     * Updates global state and component state when parameters change.
     *
     * @param {Partial<IUrlParams>} params - Updated URL parameters
     */
    const listener = (params: Partial<IUrlParams>) => {
      globalUrlParams = params;
      setUrlParams(params);
    };

    listeners.add(listener);

    // Set up bridge listener only once to prevent duplicate subscriptions
    if (!isBridgeListenerSet) {
      isBridgeListenerSet = true;

      bridge.on('syncUrlParams', (params: Partial<IUrlParams>) => {
        globalUrlParams = params;

        // Notify all registered listeners
        listeners.forEach(l => {
          l(params);
        });
      });
    }

    // 主动获取一次URL参数（为了解决时序问题）
    const tryGetUrlParams = async () => {
      try {
        // 使用bridge的方法获取当前URL参数，如果bridge支持的话
        const bridgeAny = bridge as any;
        if (bridgeAny.getUIConfig) {
          await bridgeAny.getUIConfig();
        }
      } catch (error) {
        // 忽略错误
      }
    };

    // 延迟获取，确保bridge已初始化
    setTimeout(tryGetUrlParams, 200);

    // 清理函数
    return () => {
      listeners.delete(listener);

      // 如果所有监听器都移除了，重置bridge监听器
      if (listeners.size === 0) {
        isBridgeListenerSet = false;
      }
    };
  }, [bridge]);

  return urlParams;
};