import { useState, useRef, useCallback, useEffect } from 'react';
import { usePluginBridge } from '@teable/sdk';
import { setAuthToken } from '@/lib/api';
import * as openApi from '@teable/openapi';
import { axios } from '@teable/openapi';
import { generateQRCode, IQRCodeResult } from '@/utils/qrCodeGenerator';
import { IQRCodeOptions } from '@/utils/qrCodeGenerator';
import { IConversionResult } from '@/types/barcodeGenerator';

interface ConversionStats {
  success: number;
  failed: number;
  processing: number;
}

export function useQRCodeConversion(
  tableId: string | undefined,
  selectedViewId: string,
  selectedUrlField: string,
  selectedAttachmentField: string,
  qrConfig: IQRCodeOptions,
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

  // QR码生成并上传的转换方法
  const handleQRCodeConvert = useCallback(async () => {
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
        }
      }

      // 设置定期刷新token的定时器
      if (bridge) {
        if (tokenRefreshTimerRef.current) {
          clearInterval(tokenRefreshTimerRef.current);
        }

        tokenRefreshTimerRef.current = setInterval(async () => {
          try {
            const tokenResponse = await bridge.getSelfTempToken();
            setAuthToken(tokenResponse.accessToken);
          } catch (error) {
            console.error('Failed to refresh token during conversion:', error);
          }
        }, 8 * 60 * 1000);
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
      let successCount = 0;

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

          const qrResult: IQRCodeResult = await generateQRCode(
            encodeText,
            qrConfig,
            `qrcode_${record.id}_${Date.now()}.${qrConfig.type || 'png'}`
          );

          if (qrResult.success && qrResult.blob) {
            const formData = new FormData();
            formData.append(
              'file',
              qrResult.blob,
              qrResult.fileName || `qrcode.${qrConfig.type || 'png'}`
            );

            const apiUrl = `/table/${tableId}/record/${record.id}/${selectedAttachmentField}/uploadAttachment`;

            const uploadResponse = await axios.post(apiUrl, formData);

            if (uploadResponse.data) {
              result.successCount = 1;
              successCount += 1;
              updateStats('success');
            } else {
              result.failedUrls.push(text);
              result.errors.push('Upload failed: No response data');
              updateStats('failed');
            }
          } else {
            result.failedUrls.push(text);
            result.errors.push(qrResult.error || 'QR code generation failed');
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
      console.error('QR code conversion error:', error);
    } finally {
      setIsConverting(false);
      setStats((prev) => ({ ...prev, processing: 0 }));

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
    qrConfig,
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
    handleQRCodeConvert,
  };
}

