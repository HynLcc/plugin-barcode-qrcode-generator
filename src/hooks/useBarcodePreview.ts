import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generateBarcode } from '@/utils/barcodeGenerator';
import { getPreviewTextByFormat } from '@/utils/barcodeHelpers';
import { BarcodeConfig } from '@/types/barcodeGenerator';

export function useBarcodePreview(barcodeConfig: BarcodeConfig) {
  const { t } = useTranslation('common');
  
  // 预览相关状态
  const [previewDataURL, setPreviewDataURL] = useState<string | null>(null);
  const [nextPreviewDataURL, setNextPreviewDataURL] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isPreviewFading, setIsPreviewFading] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const previewRequestIdRef = useRef<number>(0);

  // 序列化配置用于比较，避免不必要的重新生成
  const configKey = useMemo(() => {
    return JSON.stringify(barcodeConfig);
  }, [barcodeConfig]);

  // 生成预览的 useEffect（带防抖）
  useEffect(() => {
    // 清除之前的定时器
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // 设置防抖，500ms 后生成预览，避免频繁更新
    previewTimeoutRef.current = setTimeout(async () => {
      // 生成新的请求 ID，用于确保只处理最新的请求
      const currentRequestId = ++previewRequestIdRef.current;

      setIsGeneratingPreview(true);
      setPreviewError(null);

      try {
        // 使用示例文本生成预览（如果用户没有自定义文本，则使用格式对应的示例文本）
        const previewText = barcodeConfig.text || getPreviewTextByFormat(barcodeConfig.format);
        const result = await generateBarcode(
          previewText,
          barcodeConfig,
          `preview.${barcodeConfig.outputFormat.toLowerCase()}`
        );

        // 检查是否是最新的请求
        if (currentRequestId !== previewRequestIdRef.current) {
          return; // 忽略旧的请求
        }

        if (result.success && result.dataURL) {
          // 预加载图片，使用淡入淡出效果切换
          const dataURL = result.dataURL;
          const img = new Image();

          img.onload = () => {
            // 再次检查是否是最新的请求
            if (currentRequestId !== previewRequestIdRef.current) {
              return; // 忽略旧的请求
            }
            // 图片加载完成后，先设置下一张图片，然后触发淡入淡出效果
            setNextPreviewDataURL(dataURL);
            // 使用 requestAnimationFrame 确保动画流畅
            requestAnimationFrame(() => {
              setIsPreviewFading(true);

              // 等待淡出动画完成后再切换图片
              setTimeout(() => {
                if (currentRequestId !== previewRequestIdRef.current) {
                  return; // 忽略旧的请求
                }
                setPreviewDataURL(dataURL);
                setNextPreviewDataURL(null);
                setIsPreviewFading(false);
                setIsGeneratingPreview(false);
              }, 300); // 与 CSS transition duration 一致
            });
          };

          img.onerror = () => {
            // 再次检查是否是最新的请求
            if (currentRequestId !== previewRequestIdRef.current) {
              return; // 忽略旧的请求
            }
            setIsGeneratingPreview(false);
            setIsPreviewFading(false);
            setPreviewError(t('barcode.previewFailed'));
          };

          // 开始预加载图片
          img.src = dataURL;
        } else {
          // 再次检查是否是最新的请求
          if (currentRequestId !== previewRequestIdRef.current) {
            return; // 忽略旧的请求
          }
          setPreviewError(result.error || t('barcode.previewGenerationFailed'));
          setPreviewDataURL(null);
          setIsGeneratingPreview(false);
        }
      } catch (error) {
        // 再次检查是否是最新的请求
        if (currentRequestId !== previewRequestIdRef.current) {
          return; // 忽略旧的请求
        }
        const errorMessage = error instanceof Error ? error.message : t('barcode.previewGenerationFailed');
        setPreviewError(errorMessage);
        setPreviewDataURL(null);
        setIsGeneratingPreview(false);
      }
    }, 500); // 增加防抖时间到 500ms

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [configKey, barcodeConfig, t]);

  // 清理定时器的 useEffect
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    previewDataURL,
    nextPreviewDataURL,
    previewError,
    isGeneratingPreview,
    isPreviewFading,
    previewImageRef,
  };
}

