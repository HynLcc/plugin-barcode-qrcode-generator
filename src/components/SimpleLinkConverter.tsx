'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { usePluginBridge } from '@teable/sdk';
import { setAuthToken } from '@/lib/api';
import { Button } from '@teable/ui-lib/dist/shadcn/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@teable/ui-lib/dist/shadcn/ui/select';
import { Progress } from '@teable/ui-lib/dist/shadcn/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@teable/ui-lib/dist/shadcn/ui/card';
import { Separator } from '@teable/ui-lib/dist/shadcn/ui/separator';
import { Slider } from '@teable/ui-lib/dist/shadcn/ui/slider';
import { Switch } from '@teable/ui-lib/dist/shadcn/ui/switch';
import { Input } from '@teable/ui-lib/dist/shadcn/ui/input';
import { toast } from 'sonner';
import {
  AlertCircle,
  Sheet,
  ClipboardList as Form,
  LayoutGrid as Gallery,
  Kanban,
  Calendar,
  A,
  LongText,
  File,
  Settings,
  Hash,
  ChevronDown,
  ChevronUp,
} from '@teable/icons';
import * as openApi from '@teable/openapi';
import { axios } from '@teable/openapi';
import { generateBarcode, BarcodeFormat, OutputFormat, IBarcodeResult, BarcodeGenerator } from '@/utils/barcodeGenerator';
import { useViews } from '@/hooks/useViews';
import { useGlobalUrlParams } from '@/hooks/useGlobalUrlParams';
import { IView } from '@/types';

// 必填标记组件
export const RequireCom = () => <span className="mr-0.5 text-red-500">*</span>;

// 根据条码格式获取示例文本
const getPreviewTextByFormat = (format: BarcodeFormat): string => {
  switch (format) {
    case BarcodeFormat.CODE128:
      return 'Hello123';
    case BarcodeFormat.CODE128A:
      return 'ABC123';
    case BarcodeFormat.CODE128B:
      return 'Hello';
    case BarcodeFormat.CODE128C:
      return '123456';
    case BarcodeFormat.CODE39:
      return 'ABC123';
    case BarcodeFormat.EAN13:
      return '5901234123457';
    case BarcodeFormat.EAN8:
      return '96385074';
    case BarcodeFormat.EAN5:
      return '12345';
    case BarcodeFormat.EAN2:
      return '53';
    case BarcodeFormat.UPC:
      return '123456789999';
    case BarcodeFormat.UPCE:
      return '01245714';
    case BarcodeFormat.ITF:
      return '123456';
    case BarcodeFormat.ITF14:
      return '98765432109213';
    case BarcodeFormat.MSI:
      return '12345674';
    case BarcodeFormat.MSI10:
      return '1234567';
    case BarcodeFormat.MSI11:
      return '123456';
    case BarcodeFormat.MSI1010:
      return '1234567';
    case BarcodeFormat.MSI1110:
      return '12345678';
    case BarcodeFormat.pharmacode:
      return '1234';
    case BarcodeFormat.codabar:
      return 'A1234567890A';
    default:
      return '1234567890';
  }
};

interface BarcodeConfig {
  format: BarcodeFormat;
  outputFormat: OutputFormat;
  width: number;
  height: number;
  displayValue?: boolean;
  fontSize: number;
  lineColor: string;
  background: string;
  margin: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;

  // 文本显示选项
  text: string;
  font: string;
  fontOptions: string;
  textAlign: 'left' | 'center' | 'right';
  textPosition: 'top' | 'bottom';
  textMargin: number;

  // 特定格式选项
  ean128: boolean | string;
  flat: boolean;
}

export function SimpleLinkConverter() {
  const { t } = useTranslation('common');
  const { tableId } = useGlobalUrlParams();
  const bridge = usePluginBridge();

  // 获取支持的条码格式列表
  const supportedFormats = BarcodeGenerator.getSupportedFormats();

  // Token 刷新定时器引用
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration states
  const [selectedViewId, setSelectedViewId] = useState<string>('');
  const [selectedUrlField, setSelectedUrlField] = useState<string>('');
  const [selectedAttachmentField, setSelectedAttachmentField] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ success: 0, failed: 0, processing: 0 });
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  
  // 预览相关状态
  const [previewDataURL, setPreviewDataURL] = useState<string | null>(null);
  const [nextPreviewDataURL, setNextPreviewDataURL] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isPreviewFading, setIsPreviewFading] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const previewRequestIdRef = useRef<number>(0);

  // Barcode configuration
  const [barcodeConfig, setBarcodeConfig] = useState<BarcodeConfig>({
    format: BarcodeFormat.CODE128,
    outputFormat: OutputFormat.PNG,
    width: 2,
    height: 100,
    displayValue: false,
    fontSize: 20,
    lineColor: '#000000',
    background: '#FFFFFF',
    margin: 10,

    // 文本显示选项的默认值（显示文本框默认为空，预览时使用示例文本）
    text: '',
    font: 'monospace',
    fontOptions: '',
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 2,

    // 特定格式选项的默认值
    ean128: false,
    flat: false
  });

  // 清理定时器的 useEffect
  useEffect(() => {
    return () => {
      // 组件卸载时清理定时器
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
    };
  }, []);

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
            setPreviewError('预览图片加载失败');
          };
          
          // 开始预加载图片
          img.src = dataURL;
        } else {
          // 再次检查是否是最新的请求
          if (currentRequestId !== previewRequestIdRef.current) {
            return; // 忽略旧的请求
          }
          setPreviewError(result.error || '预览生成失败');
          setPreviewDataURL(null);
          setIsGeneratingPreview(false);
        }
      } catch (error) {
        // 再次检查是否是最新的请求
        if (currentRequestId !== previewRequestIdRef.current) {
          return; // 忽略旧的请求
        }
        const errorMessage = error instanceof Error ? error.message : '预览生成失败';
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
  }, [configKey]); // 使用序列化的配置作为依赖

  // Fetch table fields and records
  const { data: fields, isLoading: fieldsLoading } = useQuery({
    queryKey: ['table-fields', tableId],
    queryFn: async () => {
      if (!tableId) return [];
      const { data } = await openApi.getFields(tableId);
      return data;
    },
    enabled: !!tableId,
  });

  // Get views
  const { data: views = [], isLoading: viewsLoading } = useViews();
  const viewsArray: IView[] = Array.isArray(views) ? views : [];

  // Filter fields by type (memoized for performance)
  const textFields = useMemo(() =>
    fields?.filter(field =>
      field.type === 'longText' || field.type === 'singleLineText'
    ) || [],
    [fields]
  );

  // 获取数字内容的字段
  const numericFields = useMemo(() =>
    fields?.filter(field =>
      field.cellValueType === 'number'
    ) || [],
    [fields]
  );

  // 合并文本和数字字段作为数据源字段
  const sourceFields = useMemo(() =>
    [...textFields, ...numericFields],
    [textFields, numericFields]
  );

  const attachmentFields = useMemo(() =>
    fields?.filter(field => field.type === 'attachment') || [],
    [fields]
  );

  // Get selected field objects (memoized)
  const urlField = useMemo(() => 
    fields?.find(f => f.id === selectedUrlField),
    [fields, selectedUrlField]
  );
  
  const attachmentField = useMemo(() => 
    fields?.find(f => f.id === selectedAttachmentField),
    [fields, selectedAttachmentField]
  );

  // Check if configuration is valid
  const isConfigValid = Boolean(selectedViewId && selectedUrlField && selectedAttachmentField && urlField && attachmentField);

  // Get view icon based on view type (memoized)
  const getViewIcon = useCallback((viewType: string) => {
    const iconClassName = "w-4 h-4";

    switch (viewType) {
      case 'grid':
        return <Sheet className={iconClassName} />;
      case 'form':
        return <Form className={iconClassName} />;
      case 'gallery':
        return <Gallery className={iconClassName} />;
      case 'kanban':
        return <Kanban className={iconClassName} />;
      case 'component':
        return <Calendar className={iconClassName} />; // 使用 Calendar 图标代替 Component
      case 'calendar':
        return <Calendar className={iconClassName} />;
      default:
        return <Sheet className={iconClassName} />; // 默认使用 grid 图标
    }
  }, []);

  // Get field icon based on field type (memoized)
  const getFieldIcon = useCallback((fieldType: string, cellValueType?: string) => {
    const type = fieldType?.toLowerCase() || '';
    const cellType = cellValueType?.toLowerCase() || '';

    // 检查字段类型
    if (type === 'singlelinetext' || cellType === 'singlelinetext' || type === 'a') {
      return <A className="w-4 h-4" />;
    }
    if (type === 'longtext' || cellType === 'longtext') {
      return <LongText className="w-4 h-4" />;
    }
    if (cellType === 'number' || type === 'number') {
      return <Hash className="w-4 h-4" />;
    }

    return <A className="w-4 h-4" />; // 默认图标
  }, []);

  // 生成条码并上传的转换方法
  const handleBarcodeConvert = async () => {
    if (!isConfigValid) {
      toast.error(t('converter.configIncomplete'));
      return;
    }

    if (!tableId) {
      toast.error(t('converter.tableIdUnavailable'), {
        description: t('converter.cannotGetTableInfo')
      });
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
        fieldKeyType: 'id' as any
      });
      const records = recordsResponse.data.records;

      if (!records || records.length === 0) {
        toast.error(t('converter.noRecordsToProcess'), {
          description: t('converter.noRecordsInView')
        });
        setIsConverting(false);
        return;
      }

      const results: any[] = [];
      const totalRecords = records.length;
      let totalItems = 0;

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
        const result: any = {
          recordId: record.id,
          urlCount: 1, // 对于条码，每个记录生成一个条码
          successCount: 0,
          failedUrls: [],
          errors: []
        };

        try {
          // 编码数据始终使用字段数据
          const encodeText = text.trim();
          
          // text 选项用于覆盖显示文本（条码下方的文字），不是编码数据
          // 如果用户自定义了显示文本（不等于当前格式的示例文本），则使用自定义文本；否则不设置，让 JsBarcode 默认显示编码数据
          const currentFormatText = getPreviewTextByFormat(barcodeConfig.format);
          const isUserCustomText = barcodeConfig.text && barcodeConfig.text !== currentFormatText;
          
          // 生成条码配置：如果用户没有自定义显示文本，则清除 text 选项
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
            // 创建FormData来上传条码图片
            const formData = new FormData();
            formData.append('file', barcodeResult.blob, barcodeResult.fileName);

            // 构建 API URL
            const apiUrl = `/table/${tableId}/record/${record.id}/${selectedAttachmentField}/uploadAttachment`;

            // 上传条码图片
            const uploadResponse = await axios.post(apiUrl, formData);

            if (uploadResponse.data) {
              result.successCount = 1;
              setStats(prev => {
                const newStats = { ...prev };
                newStats.success += 1;
                newStats.processing -= 1;
                return newStats;
              });
            } else {
              result.failedUrls.push(text);
              result.errors.push('Upload failed: No response data');
              console.error(`记录 ${record.id} 上传失败: 无响应数据`);
              setStats(prev => {
                const newStats = { ...prev };
                newStats.failed += 1;
                newStats.processing -= 1;
                return newStats;
              });
            }
          } else {
            result.failedUrls.push(text);
            result.errors.push(barcodeResult.error || 'Barcode generation failed');
            setStats(prev => {
              const newStats = { ...prev };
              newStats.failed += 1;
              newStats.processing -= 1;
              return newStats;
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.failedUrls.push(text);
          result.errors.push(errorMessage);
          setStats(prev => {
            const newStats = { ...prev };
            newStats.failed += 1;
            newStats.processing -= 1;
            return newStats;
          });
        }

        if (result.urlCount > 0) {
          results.push(result);
        }

        setProgress(((i + 1) / totalRecords) * 100);
      }

      // 显示成功消息
      toast.success(t('converter.conversionCompleted'), {
        description: t('converter.barcodesGenerated', { total: totalItems, success: stats.success })
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Barcode conversion error:', error);
      toast.error(t('converter.conversionFailed'), {
        description: `${t('converter.errorDuringConversion')}: ${errorMessage}`
      });
    } finally {
      setIsConverting(false);
      setStats(prev => ({ ...prev, processing: 0 }));

      // 转换完成，清理token刷新定时器
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
    }
  };

  // 条码转换处理方法
  const handleConvert = async () => {
    return handleBarcodeConvert();
  };

  if (!tableId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <div>
            <h2 className="text-sm font-medium text-gray-900">{t('converter.pluginInitializing')}</h2>
            <p className="text-[13px] text-gray-600 mt-1">{t('converter.gettingTableInfo')}</p>
          </div>
        </div>
      </div>
    );
  }

  // 只在初始加载时显示加载状态
  if (fieldsLoading || viewsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-[13px] text-gray-600">{t('converter.loadingData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* 条码配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="w-5 h-5" />
            条码配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* 条码格式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">条码格式</label>
              <Select
                value={barcodeConfig.format}
                onValueChange={(value) => {
                  const newFormat = value as BarcodeFormat;
                  setBarcodeConfig(prev => {
                    // 如果 text 等于当前格式的示例文本，说明是自动填充的，切换格式时应该清空
                    // 如果 text 为空或等于当前格式的示例文本，清空 text（显示文本框应该保持为空）
                    const currentFormatText = getPreviewTextByFormat(prev.format);
                    const isAutoFilledText = !prev.text || prev.text === currentFormatText;
                    const newText = isAutoFilledText ? '' : prev.text;
                    return { ...prev, format: newFormat, text: newText };
                  });
                }}
                disabled={isConverting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择条码格式" />
                </SelectTrigger>
                <SelectContent>
                  {supportedFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label} - {format.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 输出格式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">输出格式</label>
              <Select
                value={barcodeConfig.outputFormat}
                onValueChange={(value) => setBarcodeConfig(prev => ({ ...prev, outputFormat: value as OutputFormat }))}
                disabled={isConverting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择输出格式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OutputFormat.PNG}>PNG - 位图格式，适合打印</SelectItem>
                  <SelectItem value={OutputFormat.SVG}>SVG - 矢量格式，文件更小</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 尺寸设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">宽度: {barcodeConfig.width}px</label>
                <Slider
                  value={[barcodeConfig.width]}
                  onValueChange={([value]) => setBarcodeConfig(prev => ({ ...prev, width: value as number }))}
                  max={10}
                  min={1}
                  step={1}
                  disabled={isConverting}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">高度: {barcodeConfig.height}px</label>
                <Slider
                  value={[barcodeConfig.height]}
                  onValueChange={([value]) => setBarcodeConfig(prev => ({ ...prev, height: value as number }))}
                  max={200}
                  min={50}
                  step={10}
                  disabled={isConverting}
                  className="w-full"
                />
              </div>
            </div>

            {/* 颜色设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">条码颜色</label>
                <input
                  type="color"
                  value={barcodeConfig.lineColor}
                  onChange={(e) => setBarcodeConfig(prev => ({ ...prev, lineColor: e.target.value }))}
                  disabled={isConverting}
                  className="w-full h-10 rounded border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">背景颜色</label>
                <input
                  type="color"
                  value={barcodeConfig.background}
                  onChange={(e) => setBarcodeConfig(prev => ({ ...prev, background: e.target.value }))}
                  disabled={isConverting}
                  className="w-full h-10 rounded border"
                />
              </div>
            </div>

            {/* 新增的JsBarcode选项 */}
            <Separator />
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setIsAdvancedOptionsOpen(!isAdvancedOptionsOpen)}
                className="flex items-center justify-between w-full text-left hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors"
                disabled={isConverting}
              >
                <h3 className="text-sm font-medium text-gray-900">高级选项</h3>
                {isAdvancedOptionsOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {isAdvancedOptionsOpen && (
                <div className="space-y-4 pt-2">
                  {/* 显示文本值开关 */}
                  <div className="flex items-center space-x-3 pb-2 border-b">
                    <Switch
                      id="displayValue"
                      checked={barcodeConfig.displayValue ?? false}
                      onCheckedChange={(checked) => setBarcodeConfig(prev => ({ ...prev, displayValue: checked }))}
                      disabled={isConverting}
                    />
                    <label htmlFor="displayValue" className="text-sm font-medium">
                      显示文本值
                    </label>
                  </div>

                  {/* 文本相关选项 - 仅在显示文本时显示 */}
                  {barcodeConfig.displayValue === true && (
                    <>
                      {/* 文本覆盖选项 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">显示文本（覆盖原始数据）</label>
                        <Input
                          value={barcodeConfig.text}
                          onChange={(e) => setBarcodeConfig(prev => ({ ...prev, text: e.target.value }))}
                          placeholder="留空使用原始数据"
                          disabled={isConverting}
                        />
                        <p className="text-[13px] text-gray-500">留空时将使用原始字段数据作为条码文本</p>
                      </div>

                      {/* 字体设置 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">字体系列</label>
                          <Select
                            value={barcodeConfig.font}
                            onValueChange={(value) => setBarcodeConfig(prev => ({ ...prev, font: value }))}
                            disabled={isConverting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择字体" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monospace">Monospace</SelectItem>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Courier New">Courier New</SelectItem>
                              <SelectItem value="Verdana">Verdana</SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">字体样式</label>
                          <Select
                            value={barcodeConfig.fontOptions || 'default'}
                            onValueChange={(value) => setBarcodeConfig(prev => ({ ...prev, fontOptions: value === 'default' ? '' : value }))}
                            disabled={isConverting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择样式" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">默认</SelectItem>
                              <SelectItem value="bold">粗体</SelectItem>
                              <SelectItem value="italic">斜体</SelectItem>
                              <SelectItem value="bold italic">粗斜体</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* 文本显示选项 */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-800">文本显示选项</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">文本位置</label>
                            <Select
                              value={barcodeConfig.textPosition}
                              onValueChange={(value) => setBarcodeConfig(prev => ({ ...prev, textPosition: value as 'top' | 'bottom' }))}
                              disabled={isConverting}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="选择位置" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="top">上方</SelectItem>
                                <SelectItem value="bottom">下方</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">文本对齐</label>
                            <Select
                              value={barcodeConfig.textAlign}
                              onValueChange={(value) => setBarcodeConfig(prev => ({ ...prev, textAlign: value as 'left' | 'center' | 'right' }))}
                              disabled={isConverting}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="选择对齐" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">左对齐</SelectItem>
                                <SelectItem value="center">居中</SelectItem>
                                <SelectItem value="right">右对齐</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">字体大小: {barcodeConfig.fontSize}px</label>
                            <Slider
                              value={[barcodeConfig.fontSize]}
                              onValueChange={([value]) => setBarcodeConfig(prev => ({ ...prev, fontSize: value as number }))}
                              max={40}
                              min={10}
                              step={2}
                              disabled={isConverting}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">文本边距: {barcodeConfig.textMargin}px</label>
                            <Slider
                              value={[barcodeConfig.textMargin]}
                              onValueChange={([value]) => setBarcodeConfig(prev => ({ ...prev, textMargin: value as number }))}
                              max={20}
                              min={0}
                              step={1}
                              disabled={isConverting}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 边距选项 */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-800">边距选项</h4>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">统一边距: {barcodeConfig.margin}px</label>
                      <Slider
                        value={[barcodeConfig.margin]}
                        onValueChange={([value]) => {
                          setBarcodeConfig(prev => {
                            // 调整统一边距时，清除所有单独边距设置，让它们使用统一边距
                            const { marginTop, marginBottom, marginLeft, marginRight, ...rest } = prev;
                            return {
                              ...rest,
                              margin: value as number,
                            };
                          });
                        }}
                        max={50}
                        min={0}
                        step={1}
                        disabled={isConverting}
                        className="w-full"
                      />
                      <p className="text-[13px] text-gray-500">设置统一的边距，可被各方向边距覆盖</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          上边距: {barcodeConfig.marginTop ?? barcodeConfig.margin}px
                        </label>
                        <Slider
                          value={[barcodeConfig.marginTop ?? barcodeConfig.margin]}
                          onValueChange={([value]) => {
                            if (value === barcodeConfig.margin) {
                              setBarcodeConfig(prev => {
                                const { marginTop, ...rest } = prev;
                                return rest;
                              });
                            } else {
                              setBarcodeConfig(prev => ({ ...prev, marginTop: value as number }));
                            }
                          }}
                          max={50}
                          min={0}
                          step={1}
                          disabled={isConverting}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          下边距: {barcodeConfig.marginBottom ?? barcodeConfig.margin}px
                        </label>
                        <Slider
                          value={[barcodeConfig.marginBottom ?? barcodeConfig.margin]}
                          onValueChange={([value]) => {
                            if (value === barcodeConfig.margin) {
                              setBarcodeConfig(prev => {
                                const { marginBottom, ...rest } = prev;
                                return rest;
                              });
                            } else {
                              setBarcodeConfig(prev => ({ ...prev, marginBottom: value as number }));
                            }
                          }}
                          max={50}
                          min={0}
                          step={1}
                          disabled={isConverting}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          左边距: {barcodeConfig.marginLeft ?? barcodeConfig.margin}px
                        </label>
                        <Slider
                          value={[barcodeConfig.marginLeft ?? barcodeConfig.margin]}
                          onValueChange={([value]) => {
                            if (value === barcodeConfig.margin) {
                              setBarcodeConfig(prev => {
                                const { marginLeft, ...rest } = prev;
                                return rest;
                              });
                            } else {
                              setBarcodeConfig(prev => ({ ...prev, marginLeft: value as number }));
                            }
                          }}
                          max={50}
                          min={0}
                          step={1}
                          disabled={isConverting}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          右边距: {barcodeConfig.marginRight ?? barcodeConfig.margin}px
                        </label>
                        <Slider
                          value={[barcodeConfig.marginRight ?? barcodeConfig.margin]}
                          onValueChange={([value]) => {
                            if (value === barcodeConfig.margin) {
                              setBarcodeConfig(prev => {
                                const { marginRight, ...rest } = prev;
                                return rest;
                              });
                            } else {
                              setBarcodeConfig(prev => ({ ...prev, marginRight: value as number }));
                            }
                          }}
                          max={50}
                          min={0}
                          step={1}
                          disabled={isConverting}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 格式特定选项 - 仅在相关格式时显示 */}
                  {((barcodeConfig.format === 'CODE128' ||
                      barcodeConfig.format === 'CODE128A' ||
                      barcodeConfig.format === 'CODE128B' ||
                      barcodeConfig.format === 'CODE128C') ||
                    (barcodeConfig.format === 'EAN13' ||
                      barcodeConfig.format === 'EAN8' ||
                      barcodeConfig.format === 'EAN5' ||
                      barcodeConfig.format === 'EAN2' ||
                      barcodeConfig.format === 'UPC' ||
                      barcodeConfig.format === 'UPCE')) && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-800">格式特定选项</h4>

                      {/* CODE128系列选项 */}
                      {(barcodeConfig.format === 'CODE128' ||
                        barcodeConfig.format === 'CODE128A' ||
                        barcodeConfig.format === 'CODE128B' ||
                        barcodeConfig.format === 'CODE128C') && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">GS1-128编码</label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={typeof barcodeConfig.ean128 === 'boolean' ? barcodeConfig.ean128 : barcodeConfig.ean128 === 'true'}
                              onCheckedChange={(checked) => setBarcodeConfig(prev => ({ ...prev, ean128: checked }))}
                              disabled={isConverting}
                            />
                            <span className="text-[13px] text-gray-600">启用GS1-128/EAN-128编码</span>
                          </div>
                          <p className="text-[13px] text-gray-500">用于国际标准物流和商品编码</p>
                        </div>
                      )}

                      {/* EAN/UPC系列选项 */}
                      {(barcodeConfig.format === 'EAN13' ||
                        barcodeConfig.format === 'EAN8' ||
                        barcodeConfig.format === 'EAN5' ||
                        barcodeConfig.format === 'EAN2' ||
                        barcodeConfig.format === 'UPC' ||
                        barcodeConfig.format === 'UPCE') && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">扁平化编码</label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={barcodeConfig.flat}
                              onCheckedChange={(checked) => setBarcodeConfig(prev => ({ ...prev, flat: checked }))}
                              disabled={isConverting}
                            />
                            <span className="text-[13px] text-gray-600">启用扁平化编码</span>
                          </div>
                          <p className="text-[13px] text-gray-500">移除扩展条和分隔符，产生更紧凑的条码</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      {/* 预览区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <span>📊</span>
            预览
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGeneratingPreview ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-[13px] text-gray-600">正在生成预览...</p>
            </div>
          ) : previewError ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-[13px] text-red-600">{previewError}</p>
              <p className="text-[13px] text-gray-500">预览文本: {barcodeConfig.text || getPreviewTextByFormat(barcodeConfig.format)}</p>
            </div>
          ) : previewDataURL ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="relative p-4 bg-white border rounded-lg flex items-center justify-center min-h-[100px] overflow-hidden">
                {/* 当前显示的图片 */}
                {previewDataURL && (
                  <img 
                    ref={previewImageRef}
                    src={previewDataURL} 
                    alt="条码预览" 
                    className={`max-w-full h-auto transition-opacity duration-300 ease-in-out ${
                      isPreviewFading ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ maxHeight: '200px' }}
                  />
                )}
                {/* 下一张预加载的图片 */}
                {nextPreviewDataURL && (
                  <img 
                    src={nextPreviewDataURL} 
                    alt="条码预览" 
                    className={`absolute inset-0 p-4 max-w-full h-auto transition-opacity duration-300 ease-in-out ${
                      isPreviewFading ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                  />
                )}
                {/* 加载指示器 */}
                {isGeneratingPreview && !nextPreviewDataURL && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-50 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              <p className="text-[13px] text-gray-500">
                预览文本: <span className="font-mono">{barcodeConfig.text || getPreviewTextByFormat(barcodeConfig.format)}</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-[13px] text-gray-500">配置条码参数以查看预览</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* 选择视图 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          <RequireCom />
          {t('converter.selectView')}
        </label>
        <Select value={selectedViewId} onValueChange={setSelectedViewId} disabled={isConverting}>
          <SelectTrigger>
            <SelectValue placeholder={t('converter.selectViewPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {viewsArray.length === 0 ? (
              <SelectItem value="no-views" disabled>{t('converter.noViewsFound')}</SelectItem>
            ) : (
              viewsArray.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  <div className="flex items-center gap-2">
                    {getViewIcon(view.type)}
                    <span>{view.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 选择源字段 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          <RequireCom />
          选择数据字段
        </label>
        <Select value={selectedUrlField} onValueChange={setSelectedUrlField} disabled={isConverting}>
          <SelectTrigger>
            <SelectValue placeholder={t('converter.selectFieldPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {sourceFields.length === 0 ? (
              <SelectItem value="no-fields" disabled>
                未找到文本或数字字段
              </SelectItem>
            ) : (
              sourceFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  <div className="flex items-center gap-2">
                    {getFieldIcon(field.type, field.cellValueType)}
                    <span>{field.name}</span>
                    <span className="text-[13px] text-gray-500 ml-1">
                      {field.cellValueType === 'number' ? '(数字)' : '(文本)'}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 选择附件字段 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          <RequireCom />
          {t('converter.selectAttachmentField')}
        </label>
        <Select value={selectedAttachmentField} onValueChange={setSelectedAttachmentField} disabled={isConverting}>
          <SelectTrigger>
            <SelectValue placeholder={t('converter.selectFieldPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {attachmentFields.length === 0 ? (
              <SelectItem value="no-fields" disabled>{t('converter.noAttachmentFieldsFound')}</SelectItem>
            ) : (
              attachmentFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4" />
                    <span>{field.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 开始转换按钮 */}
      <Button
        onClick={handleConvert}
        disabled={!isConfigValid || isConverting}
        className="w-full"
        size="lg"
      >
        {isConverting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            生成条码中...
          </>
        ) : (
          <>
            <div className="w-4 h-4 mr-2 flex items-center justify-center">📊</div>
            开始生成条码
          </>
        )}
      </Button>

      {/* 转换进度 */}
      {(isConverting || stats.success > 0 || stats.failed > 0) && (
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
            📊 条码生成进度
          </div>
          {isConverting && (
            <div className="space-y-2">
              <div className="flex justify-between text-[13px] text-gray-600 mb-1">
                <span>{t('converter.progress')}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <div className="flex gap-6 text-[13px]">
            <span className="text-green-600">{t('converter.successful')}: {stats.success}{t('converter.countUnit')}</span>
            {stats.failed > 0 && <span className="text-red-600">{t('converter.failed')}: {stats.failed}{t('converter.countUnit')}</span>}
            {stats.processing > 0 && <span className="text-blue-600">{t('converter.processing')}: {stats.processing}{t('converter.countUnit')}</span>}
          </div>
        </div>
      )}
    </div>
  );
}