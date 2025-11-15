/**
 * 附件上传器
 * 使用 Teable 的 uploadAttachment API 将 URL 转换为真正的附件
 * 支持通过 fileUrl 参数让服务器下载并上传文件
 */

import { IDownloadResult } from './fileDownloader';
import { axios } from '@teable/openapi';

/**
 * 上传进度信息
 */
export interface IUploadProgress {
  /** 上传进度百分比 (0-100) */
  percentage: number;
  /** 已上传的字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 上传速度 (字节/秒) */
  speed?: number;
  /** 剩余时间估算 (秒) */
  timeRemaining?: number;
}

/**
 * 上传结果
 */
export interface IUploadResult {
  /** 原始URL */
  originalUrl: string;
  /** 是否上传成功 */
  success: boolean;
  /** 附件ID */
  attachmentId?: string;
  /** 文件名 */
  fileName?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 上传耗时 (毫秒) */
  duration: number;
  /** 错误信息 */
  error?: string;
  /** 上传进度历史 */
  progressHistory: IUploadProgress[];
}

/**
 * 上传配置
 */
export interface IUploadConfig {
  /** 上传超时时间 (毫秒) */
  timeout: number;
  /** 重试次数 */
  retryCount: number;
  /** 重试延迟 (毫秒) */
  retryDelay: number;
  /** 是否保留原始链接作为备注 */
  preserveOriginalLink: boolean;
  /** 并发上传数 */
  maxConcurrency: number;
  /** 进度回调 */
  onProgress?: (originalUrl: string, progress: IUploadProgress) => void;
  /** 上传完成回调 */
  onComplete?: (result: IUploadResult) => void;
  /** 上传错误回调 */
  onError?: (originalUrl: string, error: string) => void;
}

/**
 * 附件上传器类
 */
export class AttachmentUploader {
  private config: IUploadConfig;
  private activeUploads = new Map<string, AbortController>();
  private uploadQueue: Array<{
    downloadResult: IDownloadResult;
    tableId: string;
    recordId: string;
    fieldId: string;
    resolve: (result: IUploadResult) => void;
  }> = [];
  private currentUploads = 0;

  constructor(config: IUploadConfig) {
    this.config = { ...config };
  }

  /**
   * 通过URL上传单个附件
   * 使用 Teable 的 uploadAttachment API，将 URL 作为 fileUrl 参数传递
   * Teable 服务器会下载文件并上传到附件字段，实现真正的附件上传
   * @param url 原始URL
   * @param fileName 文件名（用于日志记录）
   * @param tableId 表格ID
   * @param recordId 记录ID
   * @param fieldId 字段ID
   * @param retryCount 当前重试次数
   * @returns 上传结果
   */
  async uploadFromUrl(
    url: string,
    fileName: string,
    tableId: string,
    recordId: string,
    fieldId: string,
    retryCount: number = 0
  ): Promise<IUploadResult> {
    const startTime = Date.now();
    const result: IUploadResult = {
      originalUrl: url,
      success: false,
      duration: 0,
      progressHistory: []
    };

    try {
      // 创建AbortController
      const abortController = new AbortController();
      this.activeUploads.set(url, abortController);

      console.log(`Uploading from URL: ${url}`);
      console.log(`File name: ${fileName}`);
      console.log(`Target: table=${tableId}, record=${recordId}, field=${fieldId}`);

      // 使用浏览器原生的 FormData API 来调用 uploadAttachment 接口
      // 这样可以避免 Node.js form-data 包的兼容性问题
      const formData = new FormData();
      formData.append('fileUrl', url);

      // 构建 API URL（直接使用字符串模板，避免导入问题）
      const apiUrl = `/table/${tableId}/record/${recordId}/${fieldId}/uploadAttachment`;

      // 发送请求
      // axios 拦截器已经检测到 FormData 并跳过了 Content-Type 设置
      // 浏览器会自动设置正确的 multipart/form-data Content-Type 和 boundary
      const uploadResponse = await axios.post(apiUrl, formData);

      if (!uploadResponse.data) {
        throw new Error('Upload failed: No response data');
      }

      console.log('Upload response:', uploadResponse.data);

      // 填充成功结果
      result.success = true;
      result.fileName = fileName;

      // 从响应中提取附件信息
      // uploadAttachment 返回更新后的记录数据
      const recordData = uploadResponse.data;
      if (recordData.fields && recordData.fields[fieldId]) {
        const attachments = recordData.fields[fieldId] as any[];
        if (attachments && attachments.length > 0) {
          const lastAttachment = attachments[attachments.length - 1];
          result.attachmentId = lastAttachment.id;
          result.fileSize = lastAttachment.size;
        }
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown upload error';
      console.error(`Failed to upload ${url}:`, error);

      // 重试逻辑
      if (retryCount < this.config.retryCount && this.shouldRetry(error)) {
        this.config.onError?.(url, `Retrying upload (${retryCount + 1}/${this.config.retryCount}): ${result.error}`);

        // 等待重试延迟
        await this.delay(this.config.retryDelay * Math.pow(2, retryCount));

        return this.uploadFromUrl(url, fileName, tableId, recordId, fieldId, retryCount + 1);
      }
    } finally {
      this.activeUploads.delete(url);
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 处理上传队列
   */
  private async processQueue(): Promise<void> {
    if (this.currentUploads >= this.config.maxConcurrency || this.uploadQueue.length === 0) {
      return;
    }

    const { downloadResult, tableId, recordId, fieldId, resolve } = this.uploadQueue.shift()!;
    this.currentUploads++;

    try {
      // 使用uploadFromUrl方法
      const result = await this.uploadFromUrl(
        downloadResult.url,
        downloadResult.fileName || 'download',
        tableId,
        recordId,
        fieldId
      );
      resolve(result);
      this.config.onComplete?.(result);
    } catch (error) {
      const errorResult: IUploadResult = {
        originalUrl: downloadResult.url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
        duration: 0,
        progressHistory: []
      };
      resolve(errorResult);
      this.config.onError?.(downloadResult.url, errorResult.error || 'Upload failed');
    } finally {
      this.currentUploads--;
      this.processQueue(); // 处理队列中的下一个上传
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
      return error.message.includes('timeout') ||
             error.message.includes('network') ||
             error.message.includes('fetch') ||
             error.message.includes('connection') ||
             error.message.includes('500') ||
             error.message.includes('502') ||
             error.message.includes('503') ||
             error.message.includes('504');
    }
    return false;
  }

  /**
   * 从响应中提取文件名
   * @param response 下载响应
   * @param url 原始URL
   * @returns 文件名
   */
  private extractFileNameFromResponse(response: Response, url: string): string {
    // 尝试从 Content-Disposition 头获取文件名
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        return fileNameMatch[1].replace(/['"]/g, '');
      }
    }

    // 从 URL 中提取文件名
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop();
      if (fileName && fileName.includes('.')) {
        return fileName;
      }
    } catch {
      // URL 解析失败，继续使用默认方法
    }

    // 默认文件名
    return `download_${Date.now()}.bin`;
  }

  /**
   * 延迟函数
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 取消所有上传
   */
  cancelAllUploads(): void {
    for (const [, controller] of this.activeUploads) {
      controller.abort();
    }
    this.activeUploads.clear();
    this.uploadQueue.length = 0;
  }

  /**
   * 取消特定URL的上传
   * @param url 要取消的原始URL
   */
  cancelUpload(url: string): void {
    const controller = this.activeUploads.get(url);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(url);
    }
  }

  /**
   * 获取当前上传状态
   * @returns 上传状态信息
   */
  getUploadStatus(): {
    activeUploads: number;
    queuedUploads: number;
    maxConcurrency: number;
  } {
    return {
      activeUploads: this.activeUploads.size,
      queuedUploads: this.uploadQueue.length,
      maxConcurrency: this.config.maxConcurrency
    };
  }

  /**
   * 验证上传参数
   * @param tableId 表格ID
   * @param recordId 记录ID
   * @param fieldId 字段ID
   * @returns 验证结果
   */
  static validateUploadParams(
    tableId: string,
    recordId: string,
    fieldId: string
  ): { valid: boolean; error?: string } {
    if (!tableId || typeof tableId !== 'string') {
      return { valid: false, error: 'Invalid table ID' };
    }

    if (!recordId || typeof recordId !== 'string') {
      return { valid: false, error: 'Invalid record ID' };
    }

    if (!fieldId || typeof fieldId !== 'string') {
      return { valid: false, error: 'Invalid field ID' };
    }

    return { valid: true };
  }
}