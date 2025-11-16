'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@teable/ui-lib/shadcn';
import { AlertCircle } from '@teable/icons';
import { useGlobalUrlParams } from '@/hooks/useGlobalUrlParams';
import { useFieldData } from '@/hooks/useFieldData';
import { useBarcodeConversion } from '@/hooks/useBarcodeConversion';
import { useQRCodeConversion } from '@/hooks/useQRCodeConversion';
import { BarcodeFormat, OutputFormat } from '@/utils/barcodeGenerator';
import { QRErrorCorrectionLevel, IQRCodeOptions } from '@/utils/qrCodeGenerator';
import { BarcodeConfig } from '@/types/barcodeGenerator';
import { getPreviewTextByFormat } from '@/utils/barcodeHelpers';
import { BarcodeBasicConfig } from './CodeGenerator/BarcodeBasicConfig';
import { BarcodeAppearanceConfig } from './CodeGenerator/BarcodeAppearanceConfig';
import { QRCodeBasicConfig } from './CodeGenerator/QRCodeBasicConfig';
import { QRCodeAppearanceConfig } from './CodeGenerator/QRCodeAppearanceConfig';
import { GenerationProgress } from './CodeGenerator/GenerationProgress';

export function CodeGenerator() {
  const { t } = useTranslation('common');
  const { tableId } = useGlobalUrlParams();
  const { fieldsLoading, viewsLoading } = useFieldData();

  // Tab切换状态
  const [activeTab, setActiveTab] = useState<'barcode' | 'qrcode'>('barcode');

  // Configuration states
  const [selectedViewId, setSelectedViewId] = useState<string>('');
  const [selectedUrlField, setSelectedUrlField] = useState<string>('');
  const [selectedAttachmentField, setSelectedAttachmentField] = useState<string>('');
  const [isBasicConfigOpen, setIsBasicConfigOpen] = useState(true);
  const [isOptionsPreviewOpen, setIsOptionsPreviewOpen] = useState(true);

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
    text: '',
    font: 'monospace',
    fontOptions: '',
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 2,
    ean128: false,
    flat: false,
  });

  // QR码配置状态
  const [qrConfig, setQrConfig] = useState<IQRCodeOptions>({
    errorCorrectionLevel: QRErrorCorrectionLevel.H,
    width: 256,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    type: 'png',
  });

  // Get selected field objects (memoized)
  const { fields } = useFieldData();
  const urlField = useMemo(
    () => fields?.find((f) => f.id === selectedUrlField),
    [fields, selectedUrlField]
  );

  const attachmentField = useMemo(
    () => fields?.find((f) => f.id === selectedAttachmentField),
    [fields, selectedAttachmentField]
  );

  // Check if configuration is valid
  const isConfigValid = Boolean(
    selectedViewId && selectedUrlField && selectedAttachmentField && urlField && attachmentField
  );

  // Barcode conversion hook
  const {
    isConverting: isBarcodeConverting,
    progress: barcodeProgress,
    stats: barcodeStats,
    handleBarcodeConvert,
  } = useBarcodeConversion(
    tableId,
    selectedViewId,
    selectedUrlField,
    selectedAttachmentField,
    barcodeConfig,
    isConfigValid
  );

  // QR code conversion hook
  const {
    isConverting: isQRCodeConverting,
    progress: qrCodeProgress,
    stats: qrCodeStats,
    handleQRCodeConvert,
  } = useQRCodeConversion(
    tableId,
    selectedViewId,
    selectedUrlField,
    selectedAttachmentField,
    qrConfig,
    isConfigValid
  );

  // 合并转换状态
  const isConverting = activeTab === 'barcode' ? isBarcodeConverting : isQRCodeConverting;
  const progress = activeTab === 'barcode' ? barcodeProgress : qrCodeProgress;
  const stats = activeTab === 'barcode' ? barcodeStats : qrCodeStats;

  // 转换处理方法（根据当前Tab调用不同的生成函数）
  const handleConvert = async () => {
    if (activeTab === 'barcode') {
      return handleBarcodeConvert();
    } else {
      return handleQRCodeConvert();
    }
  };

  // 处理条形码配置变更（需要特殊处理format变更时的text清空逻辑）
  const handleBarcodeConfigChange = (updates: Partial<BarcodeConfig> | ((prev: BarcodeConfig) => BarcodeConfig)) => {
    if (typeof updates === 'function') {
      setBarcodeConfig(updates);
    } else {
      // 如果更新了format，需要处理text的清空逻辑
      if (updates.format && updates.format !== barcodeConfig.format) {
        const currentFormatText = getPreviewTextByFormat(barcodeConfig.format);
        const isAutoFilledText = !barcodeConfig.text || barcodeConfig.text === currentFormatText;
        const newText = isAutoFilledText ? '' : barcodeConfig.text;
        setBarcodeConfig((prev) => ({ ...prev, ...updates, text: newText }));
      } else {
        setBarcodeConfig((prev) => ({ ...prev, ...updates }));
      }
    }
  };

  if (!tableId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto" />
          <div>
            <h2 className="text-sm font-medium text-foreground">
              {t('barcode.pluginInitializing')}
            </h2>
            <p className="text-[13px] text-muted-foreground mt-1">
              {t('barcode.gettingTableInfo')}
            </p>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-[13px] text-muted-foreground">{t('barcode.loadingData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'barcode' | 'qrcode')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="barcode">{t('barcode.barcodeTabLabel')}</TabsTrigger>
          <TabsTrigger value="qrcode">{t('qrcode.qrcodeType')}</TabsTrigger>
        </TabsList>

        {/* 条形码Tab */}
        <TabsContent value="barcode" className="space-y-4 mt-4">
          <BarcodeBasicConfig
            barcodeConfig={barcodeConfig}
            onConfigChange={handleBarcodeConfigChange}
            selectedViewId={selectedViewId}
            selectedUrlField={selectedUrlField}
            selectedAttachmentField={selectedAttachmentField}
            onViewChange={setSelectedViewId}
            onUrlFieldChange={setSelectedUrlField}
            onAttachmentFieldChange={setSelectedAttachmentField}
            isOpen={isBasicConfigOpen}
            onOpenChange={setIsBasicConfigOpen}
            disabled={isConverting}
          />

          <BarcodeAppearanceConfig
            barcodeConfig={barcodeConfig}
            onConfigChange={handleBarcodeConfigChange}
            isOpen={isOptionsPreviewOpen}
            onOpenChange={setIsOptionsPreviewOpen}
            disabled={isConverting}
          />
        </TabsContent>

        {/* QR码Tab */}
        <TabsContent value="qrcode" className="space-y-4 mt-4">
          <QRCodeBasicConfig
            qrConfig={qrConfig}
            onConfigChange={(updates) => setQrConfig((prev) => ({ ...prev, ...updates }))}
            selectedViewId={selectedViewId}
            selectedUrlField={selectedUrlField}
            selectedAttachmentField={selectedAttachmentField}
            onViewChange={setSelectedViewId}
            onUrlFieldChange={setSelectedUrlField}
            onAttachmentFieldChange={setSelectedAttachmentField}
            isOpen={isBasicConfigOpen}
            onOpenChange={setIsBasicConfigOpen}
            disabled={isConverting}
          />

          <QRCodeAppearanceConfig
            qrConfig={qrConfig}
            onConfigChange={(updates) => setQrConfig((prev) => ({ ...prev, ...updates }))}
            isOpen={isOptionsPreviewOpen}
            onOpenChange={setIsOptionsPreviewOpen}
            disabled={isConverting}
          />
        </TabsContent>
      </Tabs>

      {/* 转换进度和生成按钮（两个Tab共用） */}
      <GenerationProgress
        isConverting={isConverting}
        progress={progress}
        stats={stats}
      />

      {/* 开始生成按钮 */}
      <Button
        onClick={handleConvert}
        disabled={!isConfigValid || isConverting}
        className="w-full"
        size="lg"
      >
        {isConverting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
            {t('barcode.generating')}
          </>
        ) : (
          activeTab === 'barcode' ? t('barcode.generateBarcode') : t('qrcode.generateQRCode')
        )}
      </Button>
    </div>
  );
}

