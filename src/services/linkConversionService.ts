/**
 * 链接转换服务
 * 整合URL检测、文件下载和附件上传功能
 */

import * as openApi from '@teable/openapi';
import { UrlDetector } from '../utils/urlDetector';
import { FileDownloader, IDownloadResult } from '../utils/fileDownloader';
import { AttachmentUploader, IUploadResult } from '../utils/attachmentUploader';
import { IConverterConfig, IConversionProgress, IConversionResult } from '../components/link-converter/types';

// 临时的配置接口，用于避免类型问题
interface IPartialDownloadConfig {
  maxConcurrency: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  allowAllFileTypes: boolean;
  timeout: number;
  retryCount: number;
  retryDelay: number;
  onProgress?: (url: string, progress: any) => void;
}

interface IPartialUploadConfig {
  timeout: number;
  maxConcurrency: number;
  preserveOriginalLink: boolean;
  retryCount: number;
  retryDelay: number;
  onProgress?: (url: string, progress: any) => void;
}

/**
 * 转换服务配置
 */
export interface IConversionServiceConfig {
  /** 基础转换配置 */
  converterConfig: IConverterConfig;
  /** 表格ID */
  tableId: string;
  /** 视图ID */
  viewId: string;
  /** 进度回调 */
  onProgress?: (progress: IConversionProgress) => void;
  /** 下载进度回调 */
  onDownloadProgress?: (url: string, progress: any) => void;
  /** 上传进度回调 */
  onUploadProgress?: (url: string, progress: any) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

/**
 * 链接转换结果
 */
export interface ILinkConversionResult {
  /** 总体转换结果 */
  summary: {
    /** 总链接数 */
    totalUrls: number;
    /** 成功转换数 */
    successfulConversions: number;
    /** 失败转换数 */
    failedConversions: number;
    /** 总耗时 */
    totalDuration: number;
    /** 跳过的链接数 */
    skippedUrls: number;
  };
  /** 详细转换结果 */
  results: IConversionResult[];
}

/**
 * 链接转换服务类
 */
export class LinkConversionService {
  private config: IConversionServiceConfig;
  private downloader?: FileDownloader;
  private uploader?: AttachmentUploader;
  private isConverting = false;
  private abortController?: AbortController;

  constructor(config: IConversionServiceConfig) {
    this.config = config;
  }

  /**
   * 开始转换流程
   * @returns 转换结果
   */
  async startConversion(): Promise<ILinkConversionResult> {
    if (this.isConverting) {
      throw new Error('Conversion is already in progress');
    }

    this.isConverting = true;
    this.abortController = new AbortController();

    const startTime = Date.now();

    try {
      // 阶段1: 扫描URL
      this.updateProgress({
        stage: 'scanning',
        totalUrls: 0,
        processedUrls: 0,
        successfulConversions: 0,
        failedConversions: 0
      });

      const urlRecords = await this.scanUrls();
      const totalUrls = urlRecords.length;

      if (totalUrls === 0) {
        return {
          summary: {
            totalUrls: 0,
            successfulConversions: 0,
            failedConversions: 0,
            totalDuration: Date.now() - startTime,
            skippedUrls: 0
          },
          results: []
        };
      }

      // 初始化下载器和上传器
      this.initializeServices();

      // 阶段2: 下载文件
      this.updateProgress({
        stage: 'downloading',
        totalUrls,
        processedUrls: 0,
        successfulConversions: 0,
        failedConversions: 0
      });

      const downloadResults = await this.downloadFiles(urlRecords);

      // 阶段3: 上传附件
      this.updateProgress({
        stage: 'uploading',
        totalUrls,
        processedUrls: 0,
        successfulConversions: 0,
        failedConversions: 0
      });

      const uploadResults = await this.uploadAttachments(downloadResults);

      // 生成最终结果
      const finalResults = this.generateFinalResults(urlRecords, downloadResults, uploadResults);

      return {
        summary: {
          totalUrls,
          successfulConversions: finalResults.filter(r => r.success).length,
          failedConversions: finalResults.filter(r => !r.success).length,
          totalDuration: Date.now() - startTime,
          skippedUrls: 0
        },
        results: finalResults
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
      this.config.onError?.(errorMessage);
      throw error;
    } finally {
      this.isConverting = false;
      this.cleanup();
    }
  }

  /**
   * 取消转换
   */
  cancelConversion(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.downloader?.cancelAllDownloads();
    this.uploader?.cancelAllUploads();
    this.isConverting = false;
  }

  /**
   * 扫描表格记录中的URL
   * @returns 包含URL的记录数组
   */
  private async scanUrls(): Promise<Array<{
    recordId: string;
    fieldId: string;
    url: string;
    fieldName: string;
  }>> {
    const { tableId, viewId } = this.config;
    const urlRecords: Array<{
      recordId: string;
      fieldId: string;
      url: string;
      fieldName: string;
    }> = [];

    try {
      // 获取字段信息
      const fieldsResponse = await openApi.getFields(tableId);
      const fields = fieldsResponse.data;

      // 获取选中的字段信息
      const selectedFields = fields.filter(field =>
        this.config.converterConfig.urlFieldIds.includes(field.id)
      );

      // 分页获取记录
      let skip = 0;
      const take = 100;

      while (true) {
        const recordsResponse = await openApi.getRecords(tableId, {
          viewId,
          skip,
          take
        });

        const records = recordsResponse.data.records;

        if (records.length === 0) {
          break;
        }

        // 扫描每条记录的URL字段
        for (const record of records) {
          for (const field of selectedFields) {
            const cellValue = record.fields[field.id];

            if (cellValue && typeof cellValue === 'string') {
              // 提取URL
              const urlMatches = UrlDetector.extractUrls(cellValue);

              for (const match of urlMatches) {
                urlRecords.push({
                  recordId: record.id,
                  fieldId: field.id,
                  url: match.cleanedUrl,
                  fieldName: field.name
                });
              }
            }
          }
        }

        skip += take;

        // 如果返回的记录数少于请求的数量，说明已经到最后一页
        if (records.length < take) {
          break;
        }
      }

    } catch (error) {
      console.error('Error scanning URLs:', error);
      throw new Error('Failed to scan URLs in table records');
    }

    return urlRecords;
  }

  /**
   * 下载文件
   * @param urlRecords URL记录数组
   * @returns 下载结果数组
   */
  private async downloadFiles(
    urlRecords: Array<{
      recordId: string;
      fieldId: string;
      url: string;
      fieldName: string;
    }>
  ): Promise<IDownloadResult[]> {
    const urls = urlRecords.map(record => record.url);

    return await this.downloader!.downloadFiles(urls);
  }

  /**
   * 上传附件
   * @param downloadResults 下载结果数组
   * @returns 上传结果数组
   */
  private async uploadAttachments(downloadResults: IDownloadResult[]): Promise<IUploadResult[]> {
    // 只上传成功的下载结果
    const successfulDownloads = downloadResults.filter(result => result.success);

    if (successfulDownloads.length === 0) {
      return [];
    }

    // 获取记录ID和字段ID的映射（这里需要重新扫描以获取对应的记录信息）
    const urlRecords = await this.scanUrls();
    
    // 使用 uploadFromUrl 方法循环上传每个下载结果
    const uploadPromises = successfulDownloads.map(async (downloadResult) => {
      const urlRecord = urlRecords.find(record => record.url === downloadResult.url);
      if (!urlRecord) {
        throw new Error(`Failed to find record mapping for URL: ${downloadResult.url}`);
      }

      return await this.uploader!.uploadFromUrl(
        downloadResult.url,
        downloadResult.fileName || 'download',
        this.config.tableId,
        urlRecord.recordId,
        this.config.converterConfig.attachmentFieldId
      );
    });

    return await Promise.all(uploadPromises);
  }

  /**
   * 生成最终转换结果
   * @param urlRecords URL记录
   * @param downloadResults 下载结果
   * @param uploadResults 上传结果
   * @returns 最终结果数组
   */
  private generateFinalResults(
    urlRecords: Array<{ recordId: string; fieldId: string; url: string; fieldName: string }>,
    downloadResults: IDownloadResult[],
    uploadResults: IUploadResult[]
  ): IConversionResult[] {
    const results: IConversionResult[] = [];

    for (let i = 0; i < urlRecords.length; i++) {
      const urlRecord = urlRecords[i];
      const downloadResult = downloadResults[i];
      const uploadResult = uploadResults[i];

      if (!urlRecord) {
        continue; // Skip if urlRecord is undefined
      }

      const result: IConversionResult = {
        url: urlRecord.url,
        recordId: urlRecord.recordId,
        fieldId: urlRecord.fieldId,
        success: (downloadResult?.success ?? false) && (uploadResult?.success ?? false),
        processingTime: (downloadResult?.duration || 0) + (uploadResult?.duration || 0)
      };

      // Add optional properties only if they exist
      const errorMsg = downloadResult?.error || uploadResult?.error;
      if (errorMsg) {
        result.errorMessage = errorMsg;
      }
      if (uploadResult?.attachmentId) {
        result.attachmentId = uploadResult.attachmentId;
      }
      if (downloadResult?.fileName) {
        result.fileName = downloadResult.fileName;
      }
      if (downloadResult?.fileSize !== undefined) {
        result.fileSize = downloadResult.fileSize;
      }

      results.push(result);
    }

    return results;
  }

  /**
   * 初始化下载器和上传器
   */
  private initializeServices(): void {
    // 初始化下载器
    const downloaderConfig: IPartialDownloadConfig = {
      maxConcurrency: this.config.converterConfig.concurrencyLimit,
      maxFileSize: this.config.converterConfig.maxFileSize * 1024 * 1024,
      allowedFileTypes: this.config.converterConfig.allowedFileTypes,
      allowAllFileTypes: this.config.converterConfig.allowAllFileTypes,
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000
    };

    if (this.config.onDownloadProgress) {
      downloaderConfig.onProgress = this.config.onDownloadProgress;
    }

    this.downloader = new FileDownloader(downloaderConfig as any);

    // 初始化上传器
    const uploaderConfig: IPartialUploadConfig = {
      timeout: 60000, // 60秒超时
      maxConcurrency: 2, // 上传并发数通常较小
      preserveOriginalLink: this.config.converterConfig.preserveOriginalLink,
      retryCount: 3,
      retryDelay: 2000
    };

    if (this.config.onUploadProgress) {
      uploaderConfig.onProgress = this.config.onUploadProgress;
    }

    this.uploader = new AttachmentUploader(uploaderConfig as any);
  }

  /**
   * 更新进度
   * @param progress 进度信息
   */
  private updateProgress(progress: IConversionProgress): void {
    this.config.onProgress?.(progress);
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    // 删除服务引用，让垃圾回收处理
    delete (this as any).downloader;
    delete (this as any).uploader;
    delete (this as any).abortController;
  }

  /**
   * 检查是否正在转换
   * @returns 是否正在转换
   */
  isConversionInProgress(): boolean {
    return this.isConverting;
  }
}