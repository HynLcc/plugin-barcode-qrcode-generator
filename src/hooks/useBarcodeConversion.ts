import { useState, useRef, useCallback, useEffect } from 'react';
import { usePluginBridge } from '@teable/sdk';
import { setAuthToken } from '@/lib/api';
import * as openApi from '@teable/openapi';
import { axios } from '@teable/openapi';
import { generateBarcode, IBarcodeResult } from '@/utils/barcodeGenerator';
import { getPreviewTextByFormat } from '@/utils/barcodeHelpers';
import { BarcodeConfig, IConversionResult } from '@/types/barcodeGenerator';

interface ConversionStats {
  success: number;
  failed: number;
  processing: number;
}

export function useBarcodeConversion(
  tableId: string | undefined,
  selectedViewId: string,
  selectedUrlField: string,
  selectedAttachmentField: string,
  barcodeConfig: BarcodeConfig,
  isConfigValid: boolean
) {
  const bridge = usePluginBridge();
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // 生成条形码并上传的转换方法
  const handleBarcodeConvert = useCallback(async () => {
    if (!isConfigValid) {
      return;
    }

    if (!tableId) {
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setStats({ success: 0, failed: 0, processing: 0 });

    try {
      // 在开始转换前，重新获取临时token，确保token是最新的
      if (bridge) {
        try {
          const tokenResponse = await bridge.getSelfTempToken();
          setAuthToken(tokenResponse.accessToken);
        } catch (error) {
          console.error('Failed to refresh token before conversion:', error);
          // 继续执行，使用现有token
        }
      }

      // 设置定期刷新token的定时器（每8分钟刷新一次，token有效期10分钟）
      // 这样可以确保在长时间转换过程中token不会过期
      if (bridge) {
        // 清除可能存在的旧定时器
        if (tokenRefreshTimerRef.current) {
          clearInterval(tokenRefreshTimerRef.current);
        }

        // 每8分钟刷新一次token
        tokenRefreshTimerRef.current = setInterval(async () => {
          try {
            const tokenResponse = await bridge.getSelfTempToken();
            setAuthToken(tokenResponse.accessToken);
          } catch (error) {
            console.error('Failed to refresh token during conversion:', error);
            // 刷新失败不影响转换流程，继续执行
          }
        }, 8 * 60 * 1000); // 8分钟 = 8 * 60 * 1000 毫秒
      }

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
      const totalRecords = records.length;
      let totalItems = 0;
      let successCount = 0; // 使用局部变量跟踪成功数量

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
          urlCount: 1, // 对于条形码，每个记录生成一个条形码
          successCount: 0,
          failedUrls: [],
          errors: [],
        };

        try {
          // 编码数据始终使用字段数据
          const encodeText = text.trim();

          // text 选项用于覆盖显示文本（条形码下方的文字），不是编码数据
          // 如果用户自定义了显示文本（不等于当前格式的示例文本），则使用自定义文本；否则不设置，让 JsBarcode 默认显示编码数据
          const currentFormatText = getPreviewTextByFormat(barcodeConfig.format);
          const isUserCustomText =
            barcodeConfig.text && barcodeConfig.text !== currentFormatText;

          // 生成条形码配置：如果用户没有自定义显示文本，则清除 text 选项
          const configForGeneration = isUserCustomText
            ? barcodeConfig
            : (() => {
                const { text, ...rest } = barcodeConfig;
                return rest;
              })();

          const barcodeResult: IBarcodeResult = await generateBarcode(
            encodeText,
            configForGeneration,
            `barcode_${record.id}_${Date.now()}.${barcodeConfig.outputFormat}`
          );

          if (barcodeResult.success && barcodeResult.blob) {
            // 创建FormData来上传条形码图片
            const formData = new FormData();
            formData.append('file', barcodeResult.blob, barcodeResult.fileName);

            // 构建 API URL
            const apiUrl = `/table/${tableId}/record/${record.id}/${selectedAttachmentField}/uploadAttachment`;

            // 上传条形码图片
            const uploadResponse = await axios.post(apiUrl, formData);

            if (uploadResponse.data) {
              result.successCount = 1;
              successCount += 1;
              updateStats('success');
            } else {
              result.failedUrls.push(text);
              result.errors.push('Upload failed: No response data');
              console.error(`记录 ${record.id} 上传失败: 无响应数据`);
              updateStats('failed');
            }
          } else {
            result.failedUrls.push(text);
            result.errors.push(
              barcodeResult.error || 'Barcode generation failed'
            );
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

        setProgress(((i + 1) / totalRecords) * 100);
      }
    } catch (error) {
      console.error('Barcode conversion error:', error);
    } finally {
      setIsConverting(false);
      setStats((prev) => ({ ...prev, processing: 0 }));

      // 转换完成，清理token刷新定时器
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
    }
  }, [
    isConfigValid,
    tableId,
    selectedViewId,
    selectedUrlField,
    selectedAttachmentField,
    barcodeConfig,
    bridge,
    updateStats,
  ]);

  // 清理定时器的 useEffect
  useEffect(() => {
    return () => {
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
    };
  }, []);

  return {
    isConverting,
    progress,
    stats,
    handleBarcodeConvert,
  };
}

