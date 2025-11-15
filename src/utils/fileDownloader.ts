/**
 * 文件下载器
 * 支持并发下载、进度跟踪、错误处理和重试机制
 */

import { UrlDetector, IFileInfo } from './urlDetector';
import { FileTypeCategory, FILE_TYPE_EXTENSIONS } from '../components/link-converter/types';

/**
 * 下载进度信息
 */
export interface IDownloadProgress {
  /** 下载进度百分比 (0-100) */
  percentage: number;
  /** 已下载的字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 下载速度 (字节/秒) */
  speed?: number;
  /** 剩余时间估算 (秒) */
  timeRemaining?: number;
}

/**
 * 下载结果
 */
export interface IDownloadResult {
  /** 原始URL */
  url: string;
  /** 是否下载成功 */
  success: boolean;
  /** 文件数据 (ArrayBuffer) */
  data?: ArrayBuffer;
  /** 文件信息 */
  fileInfo?: IFileInfo;
  /** 文件名 */
  fileName?: string;
  /** 文件大小 (字节) */
  fileSize?: number;
  /** MIME类型 */
  mimeType?: string;
  /** 错误信息 */
  error?: string;
  /** 下载耗时 (毫秒) */
  duration: number;
  /** 下载进度历史 */
  progressHistory: IDownloadProgress[];
}

/**
 * 下载配置
 */
export interface IDownloadConfig {
  /** 最大并发下载数 */
  maxConcurrency: number;
  /** 文件大小限制 (字节) */
  maxFileSize: number;
  /** 请求超时时间 (毫秒) */
  timeout: number;
  /** 重试次数 */
  retryCount: number;
  /** 重试延迟 (毫秒) */
  retryDelay: number;
  /** 允许的文件类型 */
  allowedFileTypes: FileTypeCategory[];
  /** 是否允许所有文件类型 */
  allowAllFileTypes: boolean;
  /** 进度回调 */
  onProgress?: (url: string, progress: IDownloadProgress) => void;
  /** 下载完成回调 */
  onComplete?: (result: IDownloadResult) => void;
  /** 下载错误回调 */
  onError?: (url: string, error: string) => void;
}

/**
 * 文件下载器类
 */
export class FileDownloader {
  private config: IDownloadConfig;
  private activeDownloads = new Map<string, AbortController>();
  private downloadQueue: Array<{ url: string; resolve: (result: IDownloadResult) => void }> = [];
  private currentDownloads = 0;

  constructor(config: IDownloadConfig) {
    this.config = { ...config };
  }

  /**
   * 下载单个文件
   * @param url 文件URL
   * @param retryCount 当前重试次数
   * @returns 下载结果
   */
  async downloadFile(url: string, retryCount: number = 0): Promise<IDownloadResult> {
    const startTime = Date.now();
    const result: IDownloadResult = {
      url,
      success: false,
      duration: 0,
      progressHistory: []
    };

    try {
      // 清理URL
      const normalizedUrl = UrlDetector.normalizeUrl(url);
      if (!UrlDetector.isValidUrl(normalizedUrl)) {
        throw new Error('Invalid URL format');
      }

      // 检查文件类型
      const fileInfo = UrlDetector.extractFileInfo(normalizedUrl);
      if (!this.isFileTypeAllowed(fileInfo)) {
        throw new Error('File type not allowed');
      }

      // 创建AbortController用于取消下载
      const abortController = new AbortController();
      this.activeDownloads.set(url, abortController);

      // 开始下载
      const response = await fetch(normalizedUrl, {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : undefined;

      // 检查文件大小
      if (totalSize && totalSize > this.config.maxFileSize) {
        throw new Error(`File size (${Math.round(totalSize / 1024 / 1024)}MB) exceeds limit (${Math.round(this.config.maxFileSize / 1024 / 1024)}MB)`);
      }

      // 读取响应数据
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read response body');
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;
      const progressHistory: IDownloadProgress[] = [];
      let lastProgressTime = Date.now();

      // 读取数据流
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        // 检查文件大小限制
        if (loaded > this.config.maxFileSize) {
          throw new Error(`File size exceeds limit during download`);
        }

        // 记录进度
        const now = Date.now();
        if (now - lastProgressTime > 500) { // 每500ms更新一次进度
          const progress: IDownloadProgress = {
            percentage: totalSize ? (loaded / totalSize) * 100 : 0,
            loaded,
            total: totalSize || 0
          };

          progressHistory.push(progress);
          this.config.onProgress?.(url, progress);
          lastProgressTime = now;
        }
      }

      // 合并所有数据块
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const data = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.length;
      }

      // 生成文件名
      const fileName = fileInfo ? UrlDetector.generateSafeFileName(url, fileInfo.extension) :
                                  UrlDetector.generateSafeFileName(url);

      // 填充结果
      result.success = true;
      result.data = data.buffer;
      if (fileInfo) {
        result.fileInfo = fileInfo;
      }
      result.fileName = fileName;
      result.fileSize = data.length;
      result.mimeType = fileInfo?.mimeType || response.headers.get('content-type') || 'application/octet-stream';
      result.progressHistory = progressHistory;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error occurred';

      // 重试逻辑
      if (retryCount < this.config.retryCount && this.shouldRetry(error)) {
        this.config.onError?.(url, `Retrying (${retryCount + 1}/${this.config.retryCount}): ${result.error}`);

        // 等待重试延迟
        await this.delay(this.config.retryDelay * Math.pow(2, retryCount));

        return this.downloadFile(url, retryCount + 1);
      }
    } finally {
      // 清理
      this.activeDownloads.delete(url);
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 并发下载多个文件
   * @param urls URL数组
   * @returns 下载结果数组
   */
  async downloadFiles(urls: string[]): Promise<IDownloadResult[]> {
    const results: IDownloadResult[] = [];

    // 创建下载Promise数组
    const downloadPromises = urls.map(url =>
      new Promise<IDownloadResult>((resolve) => {
        this.downloadQueue.push({ url, resolve });
        this.processQueue();
      })
    );

    // 等待所有下载完成
    const downloadResults = await Promise.all(downloadPromises);
    results.push(...downloadResults);

    return results;
  }

  /**
   * 处理下载队列
   */
  private async processQueue(): Promise<void> {
    if (this.currentDownloads >= this.config.maxConcurrency || this.downloadQueue.length === 0) {
      return;
    }

    const { url, resolve } = this.downloadQueue.shift()!;
    this.currentDownloads++;

    try {
      const result = await this.downloadFile(url);
      resolve(result);
      this.config.onComplete?.(result);
    } catch (error) {
      const errorResult: IDownloadResult = {
        url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 0,
        progressHistory: []
      };
      resolve(errorResult);
      this.config.onError?.(url, errorResult.error || 'Download failed');
    } finally {
      this.currentDownloads--;
      this.processQueue(); // 处理队列中的下一个下载
    }
  }

  /**
   * 检查是否应该重试
   * @param error 错误对象
   * @returns 是否应该重试
   */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      // 网络错误或超时错误可以重试
      return error.message.includes('fetch') ||
             error.message.includes('timeout') ||
             error.message.includes('network') ||
             error.message.includes('Failed to fetch');
    }
    return false;
  }

  /**
   * 延迟函数
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查文件类型是否允许
   * @param fileInfo 文件信息
   * @returns 是否允许
   */
  private isFileTypeAllowed(fileInfo: IFileInfo | null): boolean {
    if (this.config.allowAllFileTypes) {
      return true;
    }

    if (!fileInfo || !fileInfo.extension) {
      // 没有扩展名的文件（可能是网页），允许下载
      return true;
    }

    // 检查是否为危险文件
    if (fileInfo.isDangerous) {
      return false;
    }

    // 检查是否在允许的文件类型中
    for (const fileType of this.config.allowedFileTypes) {
      if (FILE_TYPE_EXTENSIONS[fileType].includes(fileInfo.extension)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 取消所有下载
   */
  cancelAllDownloads(): void {
    for (const [, controller] of this.activeDownloads) {
      controller.abort();
    }
    this.activeDownloads.clear();
    this.downloadQueue.length = 0;
  }

  /**
   * 取消特定URL的下载
   * @param url 要取消的URL
   */
  cancelDownload(url: string): void {
    const controller = this.activeDownloads.get(url);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(url);
    }
  }

  /**
   * 获取当前下载状态
   * @returns 下载状态信息
   */
  getDownloadStatus(): {
    activeDownloads: number;
    queuedDownloads: number;
    maxConcurrency: number;
  } {
    return {
      activeDownloads: this.activeDownloads.size,
      queuedDownloads: this.downloadQueue.length,
      maxConcurrency: this.config.maxConcurrency
    };
  }
}