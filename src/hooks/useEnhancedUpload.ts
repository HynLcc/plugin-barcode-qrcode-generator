import { useCallback, useMemo } from 'react';
import { useUploadToken } from './useUploadToken';
import { UploadQueue, defaultUploadQueue } from '@/utils/uploadQueue';
import { axios } from '@teable/openapi';

/**
 * 上传任务参数接口
 */
interface UploadTaskParams {
  /** 表格ID */
  tableId: string;
  /** 记录ID */
  recordId: string;
  /** 附件字段ID */
  attachmentFieldId: string;
  /** 要上传的文件Blob */
  blob: Blob;
  /** 文件名 */
  fileName: string;
}

/**
 * 上传结果接口
 */
interface UploadResult {
  /** 是否成功 */
  success: boolean;
  /** 上传响应数据 */
  data?: any;
  /** 错误信息 */
  error?: string;
  /** 是否经过了重试 */
  retried?: boolean;
}

/**
 * 增强的上传钩子
 *
 * 提供基于队列的文件上传功能，支持：
 * - QPS限制
 * - 并发控制
 * - 智能重试
 * - Token管理
 */
export function useEnhancedUpload(
  queue: UploadQueue = defaultUploadQueue
) {
  const { executeWithFreshToken } = useUploadToken();

  /**
   * 执行单个文件上传
   *
   * @param params 上传参数
   * @returns 上传结果
   */
  const uploadFile = useCallback(async (
    params: UploadTaskParams
  ): Promise<UploadResult> => {
    const { tableId, recordId, attachmentFieldId, blob, fileName } = params;
    const taskId = `${recordId}-${Date.now()}-${Math.random()}`;

    const task = {
      id: taskId,
      execute: async () => {
        return executeWithFreshToken(async (token) => {
          // 创建FormData
          const formData = new FormData();
          formData.append('file', blob, fileName);

          // 构建API URL
          const apiUrl = `/table/${tableId}/record/${recordId}/${attachmentFieldId}/uploadAttachment`;

          try {
            // 执行上传请求
            const response = await axios.post(apiUrl, formData, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
              timeout: 30000, // 30秒超时
            });

            return response.data;
          } catch (error: any) {
            // 对于500错误，提供更详细的错误信息
            if (error.response?.status === 500) {
              console.error(`上传任务 ${taskId} 遇到500错误，但文件可能已成功上传:`, error);
              throw new Error(`Upload failed with 500 error: ${error.message}`);
            }

            // 其他错误直接抛出
            throw error;
          }
        });
      },
      maxRetries: 3, // 最大重试3次
    };

    try {
      const result = await queue.addTask(task);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error(`上传任务 ${taskId} 最终失败:`, error);
      return {
        success: false,
        error: error.message || 'Unknown upload error',
      };
    }
  }, [executeWithFreshToken, queue]);

  /**
   * 批量上传文件
   *
   * @param tasks 上传任务数组
   * @returns 上传结果数组
   */
  const uploadBatch = useCallback(async (
    tasks: UploadTaskParams[]
  ): Promise<UploadResult[]> => {
    const uploadPromises = tasks.map(task => uploadFile(task));
    return Promise.all(uploadPromises);
  }, [uploadFile]);

  /**
   * 获取队列状态
   *
   * @returns 队列状态信息
   */
  const getQueueStatus = useCallback(() => {
    return queue.getStatus();
  }, [queue]);

  /**
   * 等待所有上传完成
   *
   * @returns Promise
   */
  const waitForAllUploads = useCallback(async () => {
    return queue.waitForCompletion();
  }, [queue]);

  /**
   * 清空上传队列
   */
  const clearQueue = useCallback(() => {
    queue.clear();
  }, [queue]);

  // 返回队列状态的实时信息
  const queueStatus = useMemo(() => {
    return queue.getStatus();
  }, [queue]);

  return {
    // 核心上传功能
    uploadFile,
    uploadBatch,

    // 队列管理功能
    getQueueStatus,
    waitForAllUploads,
    clearQueue,

    // 实时状态
    queueStatus,

    // 计算属性
    isUploading: queueStatus.running > 0 || queueStatus.queueLength > 0,
    pendingUploads: queueStatus.queueLength,
    activeUploads: queueStatus.running,
  };
}