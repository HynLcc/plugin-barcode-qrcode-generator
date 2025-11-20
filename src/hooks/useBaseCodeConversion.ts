import { useState, useCallback } from 'react';
import * as openApi from '@teable/openapi';
import { IConversionResult } from '@/types/barcodeGenerator';
import { useEnhancedUpload } from './useEnhancedUpload';

// 通用的代码生成结果接口
export interface ICodeResult {
  success: boolean;
  dataURL?: string;
  blob?: Blob;
  fileName?: string;
  error?: string;
}

// 通用的代码生成函数类型
export type CodeGeneratorFunction<T> = (
  text: string,
  config: T,
  fileName: string
) => Promise<ICodeResult>;

interface ConversionStats {
  success: number;
  failed: number;
  processing: number;
}

/**
 * 通用代码转换Hook
 * 支持条形码和QR码的转换逻辑复用
 */
export function useBaseCodeConversion<T>(
  tableId: string | undefined,
  selectedViewId: string,
  selectedUrlField: string,
  selectedAttachmentField: string,
  config: T,
  isConfigValid: boolean,
  generateCode: CodeGeneratorFunction<T>
) {
  const { uploadFile, waitForAllUploads, isUploading, pendingUploads, activeUploads } = useEnhancedUpload();

  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ConversionStats>({
    success: 0,
    failed: 0,
    processing: 0,
  });

  // 更新统计信息的辅助函数
  const updateStats = useCallback(
    (type: 'success' | 'failed', increment: number = 1) => {
      setStats((prev) => {
        const newStats = { ...prev };
        if (type === 'success') {
          newStats.success += increment;
        } else {
          newStats.failed += increment;
        }
        newStats.processing -= increment;
        return newStats;
      });
    },
    []
  );

  // 通用转换方法
  const handleConvert = useCallback(async () => {
    if (!isConfigValid || !tableId) {
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setStats({ success: 0, failed: 0, processing: 0 });

    try {
      // 获取记录
      const recordsResponse = await openApi.getRecords(tableId, {
        viewId: selectedViewId,
        fieldKeyType: 'id' as any,
      });
      const records = recordsResponse.data.records;

      if (!records || records.length === 0) {
        setIsConverting(false);
        return;
      }

      const results: IConversionResult[] = [];
      let totalItems = 0;

      // 准备所有上传任务
      const uploadTasks: Array<{
        recordId: string;
        text: string;
        uploadTask: Promise<boolean>;
      }> = [];

      console.log('开始生成代码并准备上传...');
      setProgress(0);

      // 生成所有代码并准备上传任务
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (!record) continue;

        // 获取数据内容（支持文本和数字）
        const fieldValue = record.fields[selectedUrlField];
        const text = fieldValue != null ? String(fieldValue) : '';

        if (!text || text.trim().length === 0) {
          continue;
        }

        totalItems += 1;
        setStats((prev) => ({ ...prev, processing: prev.processing + 1 }));

        const result: IConversionResult = {
          recordId: record.id,
          urlCount: 1,
          successCount: 0,
          failedUrls: [],
          errors: [],
        };

        try {
          const encodeText = text.trim();

          const codeResult: ICodeResult = await generateCode(
            encodeText,
            config,
            `code_${record.id}_${Date.now()}.${(config as any).type || 'png'}`
          );

          if (codeResult.success && codeResult.blob) {
            // 创建上传任务但不立即执行
            const uploadPromise = uploadFile({
              tableId: tableId!,
              recordId: record.id,
              attachmentFieldId: selectedAttachmentField,
              blob: codeResult.blob!,
              fileName: codeResult.fileName || `code_${record.id}.png`,
            }).then((uploadResult) => {
              if (uploadResult.success) {
                result.successCount = 1;
                updateStats('success');
                return true;
              } else {
                result.failedUrls.push(text);
                result.errors.push(uploadResult.error || 'Upload failed');
                updateStats('failed');
                return false;
              }
            }).catch((error) => {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown upload error';
              result.failedUrls.push(text);
              result.errors.push(errorMessage);
              updateStats('failed');
              return false;
            });

            uploadTasks.push({
              recordId: record.id,
              text,
              uploadTask: uploadPromise,
            });
          } else {
            result.failedUrls.push(text);
            result.errors.push(codeResult.error || 'Code generation failed');
            updateStats('failed');
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          result.failedUrls.push(text);
          result.errors.push(errorMessage);
          updateStats('failed');
        }

        if (result.urlCount > 0) {
          results.push(result);
        }
      }

      console.log(`准备完成，共 ${uploadTasks.length} 个文件开始上传...`);

      // 执行上传任务 (进度 0-100%，只统计成功上传)
      if (uploadTasks.length > 0) {
        // 监听上传进度，基于成功的上传数量
        let successfulUploads = 0;
        const uploadProgressInterval = setInterval(() => {
          // 进度：0-100%，基于成功数量计算
          const successProgress = (successfulUploads / uploadTasks.length) * 100;
          setProgress(successProgress);

          // 如果所有上传都成功了，清除定时器
          if (successfulUploads === uploadTasks.length) {
            clearInterval(uploadProgressInterval);
            setProgress(100);
          }
        }, 500);

        // 开始所有上传任务
        const uploadPromises = uploadTasks.map(async (task, index) => {
          try {
            const result = await task.uploadTask;
            if (result) {
              successfulUploads++; // 只有成功才计数
            }
            return result;
          } catch (error) {
            return false;
          }
        });

        // 等待所有上传完成
        await Promise.all(uploadPromises);

        // 确保最终进度设置
        clearInterval(uploadProgressInterval);

        // 如果不是全部成功，进度保持当前成功比例
        if (successfulUploads < uploadTasks.length) {
          const finalProgress = (successfulUploads / uploadTasks.length) * 100;
          setProgress(finalProgress);
        } else {
          setProgress(100);
        }

        console.log(`上传完成，成功: ${successfulUploads}/${uploadTasks.length}`);
      } else {
        setProgress(100); // 没有文件需要上传，直接完成
      }
    } catch (error) {
      console.error('Code conversion error:', error);
    } finally {
      setIsConverting(false);
      setStats((prev) => ({ ...prev, processing: 0 }));
    }
  }, [
    isConfigValid,
    tableId,
    selectedViewId,
    selectedUrlField,
    selectedAttachmentField,
    config,
    generateCode,
    uploadFile,
    waitForAllUploads,
    updateStats,
  ]);

  return {
    isConverting,
    progress,
    stats,
    handleConvert,
    // 队列状态信息
    isUploading,
    pendingUploads,
    activeUploads,
  };
}