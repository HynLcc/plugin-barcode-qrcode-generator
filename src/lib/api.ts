import { axios } from "@teable/openapi";

// 获取Teable主应用的host地址
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // 优先从document.referrer获取Teable主应用的地址
    if (document.referrer) {
      const referrerUrl = new URL(document.referrer);
      return `${referrerUrl.protocol}//${referrerUrl.host}/api`;
    }

    // 如果没有referrer，假设主应用在3000端口（开发环境）
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://127.0.0.1:3000/api';
    }

    // 生产环境使用当前域名
    return `${window.location.origin}/api`;
  }

  // 默认值，用于服务端渲染
  return 'http://127.0.0.1:3000/api';
}

// 设置API基础配置
export function configureApi() {
  // 动态获取API基础URL
  const baseUrl = getApiBaseUrl();
  axios.defaults.baseURL = baseUrl;

  // 添加请求拦截器，确保每次请求都有正确的配置
  axios.interceptors.request.use(async (config) => {
    // 动态获取最新的baseURL
    const currentBaseUrl = getApiBaseUrl();

    // 确保baseURL正确设置
    if (!config.baseURL || config.baseURL.startsWith('/')) {
      config.baseURL = currentBaseUrl;
    }

    // 确保Content-Type（但如果是 FormData，让浏览器自动设置）
    // FormData 需要浏览器自动设置 multipart/form-data 的 boundary
    if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  });
}

// 设置认证token
export function setAuthToken(token: string) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// 清除认证token
export function clearAuthToken() {
  delete axios.defaults.headers.common['Authorization'];
}

// 重新配置API（当URL参数变化时使用）
export function reconfigureApi() {
  const baseUrl = getApiBaseUrl();
  axios.defaults.baseURL = baseUrl;
}