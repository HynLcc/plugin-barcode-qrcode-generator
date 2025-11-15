/**
 * URL检测和解析工具
 * 用于从文本中提取和验证URL链接
 */

import { DANGEROUS_FILE_EXTENSIONS } from '../components/link-converter/types';

/**
 * URL匹配结果
 */
export interface IUrlMatch {
  /** 完整的URL */
  url: string;
  /** URL在文本中的开始位置 */
  startIndex: number;
  /** URL在文本中的结束位置 */
  endIndex: number;
  /** 清理后的URL（添加协议前缀） */
  cleanedUrl: string;
}

/**
 * 文件信息
 */
export interface IFileInfo {
  /** 文件扩展名 */
  extension: string;
  /** 文件名（不含扩展名） */
  fileName: string;
  /** 是否为危险文件类型 */
  isDangerous: boolean;
  /** 文件MIME类型 */
  mimeType?: string;
}

/**
 * URL检测器类
 */
export class UrlDetector {
  // URL匹配的正则表达式
  private static readonly URL_PATTERNS = [
    // http:// 或 https:// 开头的URL
    /(https?:\/\/[^\s<>"']+)/gi,
    // www. 开头的URL（需要添加http://）
    /(www\.[^\s<>"']+)/gi,
  ];


  /**
   * 从文本中提取所有URL
   * @param text 要检测的文本
   * @returns 匹配到的URL数组
   */
  static extractUrls(text: string): IUrlMatch[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const matches: IUrlMatch[] = [];

    this.URL_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const url = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + url.length;

        // 清理URL（为www开头的URL添加协议）
        let cleanedUrl = url;
        if (url.startsWith('www.')) {
          cleanedUrl = `https://${url}`;
        }

        // 验证URL格式
        if (this.isValidUrl(cleanedUrl)) {
          matches.push({
            url,
            startIndex,
            endIndex,
            cleanedUrl
          });
        }
      }
    });

    return matches;
  }

  /**
   * 验证URL格式是否正确
   * @param url 要验证的URL
   * @returns 是否为有效URL
   */
  static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // 检查协议是否为http或https
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * 从URL中提取文件信息
   * @param url URL字符串
   * @returns 文件信息对象
   */
  static extractFileInfo(url: string): IFileInfo | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // 获取文件名部分
      const fileNameWithExt = pathname.split('/').pop() || '';
      const lastDotIndex = fileNameWithExt.lastIndexOf('.');

      if (lastDotIndex === -1) {
        // 没有扩展名，可能是网页而不是文件
        return null;
      }

      const extension = fileNameWithExt.substring(lastDotIndex + 1).toLowerCase();
      const fileName = fileNameWithExt.substring(0, lastDotIndex);

      // 检查是否为危险文件类型
      const isDangerous = DANGEROUS_FILE_EXTENSIONS.includes(extension);

      // 推断MIME类型
      const mimeType = this.inferMimeType(extension);

      return {
        extension,
        fileName,
        isDangerous,
        mimeType
      };
    } catch {
      return null;
    }
  }

  /**
   * 推断文件的MIME类型
   * @param extension 文件扩展名
   * @returns MIME类型字符串
   */
  static inferMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      // 图片
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',

      // 文档
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'rtf': 'application/rtf',

      // 音视频
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mov': 'video/quicktime',
      'mkv': 'video/x-matroska',
      'flv': 'video/x-flv',
      'webm': 'video/webm',

      // 压缩包
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      'bz2': 'application/x-bzip2'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * 从URL生成安全的文件名
   * @param url 原始URL
   * @param extension 文件扩展名（可选）
   * @returns 安全的文件名
   */
  static generateSafeFileName(url: string, extension?: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/[^\w.-]/g, '_');
      const pathname = urlObj.pathname.replace(/[^\w.-]/g, '_');
      const timestamp = Date.now();

      // 从路径中提取文件名
      const originalFileName = pathname.split('/').pop() || 'file';

      // 清理文件名
      let safeFileName = originalFileName.replace(/[^\w.-]/g, '_');

      // 确保文件名不为空
      if (!safeFileName || safeFileName === '_') {
        safeFileName = `${hostname}_file`;
      }

      // 添加扩展名
      if (extension && !safeFileName.endsWith(`.${extension}`)) {
        safeFileName += `.${extension}`;
      }

      // 添加时间戳以避免冲突
      const lastDotIndex = safeFileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        const namePart = safeFileName.substring(0, lastDotIndex);
        const extPart = safeFileName.substring(lastDotIndex);
        return `${namePart}_${timestamp}${extPart}`;
      } else {
        return `${safeFileName}_${timestamp}`;
      }
    } catch {
      // 如果URL解析失败，返回基于时间戳的默认文件名
      const fallbackTimestamp = Date.now();
      return `download_${fallbackTimestamp}${extension ? `.${extension}` : ''}`;
    }
  }

  /**
   * 清理和规范化URL
   * @param url 原始URL
   * @returns 清理后的URL
   */
  static normalizeUrl(url: string): string {
    if (!url) return '';

    // 移除首尾空格
    let cleanedUrl = url.trim();

    // 为www开头的URL添加https://
    if (cleanedUrl.startsWith('www.')) {
      cleanedUrl = `https://${cleanedUrl}`;
    }

    try {
      // 验证并返回规范的URL
      const urlObj = new URL(cleanedUrl);
      return urlObj.toString();
    } catch {
      // 如果无效，返回原始字符串
      return url;
    }
  }

  /**
   * 检查文本是否包含URL
   * @param text 要检测的文本
   * @returns 是否包含URL
   */
  static containsUrl(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    return this.URL_PATTERNS.some(pattern => {
      pattern.lastIndex = 0; // 重置正则表达式状态
      return pattern.test(text);
    });
  }

  /**
   * 获取URL的域名
   * @param url URL字符串
   * @returns 域名字符串，如果解析失败返回null
   */
  static getDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  /**
   * 检查URL是否指向常见的文件托管服务
   * @param url URL字符串
   * @returns 是否为文件托管服务
   */
  static isFileHostingService(url: string): boolean {
    const domain = this.getDomain(url);
    if (!domain) return false;

    const fileHostingDomains = [
      'drive.google.com',
      'dropbox.com',
      'onedrive.live.com',
      'icloud.com',
      'mediafire.com',
      'mega.nz',
      'we.tl',
      'transfer.sh',
      'gofile.io',
      'anonfiles.com',
      'bayfiles.com'
    ];

    return fileHostingDomains.some(hostingDomain =>
      domain.toLowerCase().includes(hostingDomain)
    );
  }
}