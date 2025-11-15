/**
 * URL 提取工具函数
 */

/**
 * 从文本中提取 URL
 * @param text 要提取的文本
 * @returns URL 数组
 */
export function extractUrls(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  const urlPattern = /(https?:\/\/[^\s<>"']+)/gi;
  const matches = text.match(urlPattern);
  return matches || [];
}

