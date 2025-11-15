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
export const RequireCom = () => <span className="ml-0.5 text-red-500">*</span>;

interface BarcodeConfig {
  format: BarcodeFormat;
  outputFormat: OutputFormat;
  width: number;
  height: number;
  displayValue: boolean;
  fontSize: number;
  lineColor: string;
  background: string;
  margin: number;

  // 新增的JsBarcode选项
  text: string;
  font: string;
  fontOptions: string;
  ean128: boolean | string;
  flat: boolean;
  lastChar: string;
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

  // Barcode configuration
  const [barcodeConfig, setBarcodeConfig] = useState<BarcodeConfig>({
    format: BarcodeFormat.CODE128,
    outputFormat: OutputFormat.PNG,
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 20,
    lineColor: '#000000',
    background: '#FFFFFF',
    margin: 10,

    // 新增选项的默认值
    text: '',
    font: 'monospace',
    fontOptions: '',
    ean128: false,
    flat: false,
    lastChar: ''
  });

  // 清理定时器的 useEffect
  useEffect(() => {
    return () => {
      // 组件卸载时清理定时器
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
    };
  }, []);

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
          // 生成条码
          const barcodeResult: IBarcodeResult = await generateBarcode(
            text.trim(),
            barcodeConfig,
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
            <h2 className="text-lg font-medium text-gray-900">{t('converter.pluginInitializing')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('converter.gettingTableInfo')}</p>
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
          <p className="text-sm text-gray-600">{t('converter.loadingData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* 条码配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
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
                onValueChange={(value) => setBarcodeConfig(prev => ({ ...prev, format: value as BarcodeFormat }))}
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

            {/* 显示设置 */}
            <div className="flex items-center space-x-3">
              <Switch
                id="displayValue"
                checked={barcodeConfig.displayValue}
                onCheckedChange={(checked) => setBarcodeConfig(prev => ({ ...prev, displayValue: checked as boolean }))}
                disabled={isConverting}
              />
              <label htmlFor="displayValue" className="text-sm font-medium">
                显示文本值
              </label>
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
                <h3 className="text-lg font-medium text-gray-900">高级选项</h3>
                {isAdvancedOptionsOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {isAdvancedOptionsOpen && (
                <div className="space-y-4 pt-2">
                  {/* 文本覆盖选项 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">显示文本（覆盖原始数据）</label>
                    <Input
                      value={barcodeConfig.text}
                      onChange={(e) => setBarcodeConfig(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="留空使用原始数据"
                      disabled={isConverting}
                    />
                    <p className="text-xs text-gray-500">留空时将使用原始字段数据作为条码文本</p>
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

                  {/* 格式特定选项 */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-800">格式特定选项</h4>

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
                          <span className="text-sm text-gray-600">启用GS1-128/EAN-128编码</span>
                        </div>
                        <p className="text-xs text-gray-500">用于国际标准物流和商品编码</p>
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
                          <span className="text-sm text-gray-600">启用扁平化编码</span>
                        </div>
                        <p className="text-xs text-gray-500">移除扩展条和分隔符，产生更紧凑的条码</p>
                      </div>
                    )}

                    {/* 通用选项 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">最后字符</label>
                        <Input
                          value={barcodeConfig.lastChar}
                          onChange={(e) => setBarcodeConfig(prev => ({ ...prev, lastChar: e.target.value }))}
                          placeholder="可选"
                          disabled={isConverting}
                          maxLength={1}
                        />
                        <p className="text-xs text-gray-500">添加到条码末尾的字符</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      <Separator />

      {/* 选择视图 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          {t('converter.selectView')}
          <RequireCom />
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
          选择数据字段
          <RequireCom />
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
                    <span className="text-xs text-gray-500 ml-1">
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
          {t('converter.selectAttachmentField')}
          <RequireCom />
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
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{t('converter.progress')}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <div className="flex gap-6 text-sm">
            <span className="text-green-600">{t('converter.successful')}: {stats.success}{t('converter.countUnit')}</span>
            {stats.failed > 0 && <span className="text-red-600">{t('converter.failed')}: {stats.failed}{t('converter.countUnit')}</span>}
            {stats.processing > 0 && <span className="text-blue-600">{t('converter.processing')}: {stats.processing}{t('converter.countUnit')}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

