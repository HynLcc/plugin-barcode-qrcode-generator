'use client';

import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Slider,
  Switch,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@teable/ui-lib/shadcn';
import { Settings, ChevronDown, ChevronUp, AlertCircle } from '@teable/icons';
import { BarcodeFormat } from '@/utils/barcodeGenerator';
import { BarcodeConfig } from '@/types/barcodeGenerator';
import { getPreviewTextByFormat } from '@/utils/barcodeHelpers';
import { useBarcodePreview } from '@/hooks/useBarcodePreview';

interface BarcodeAppearanceConfigProps {
  barcodeConfig: BarcodeConfig;
  onConfigChange: (config: Partial<BarcodeConfig> | ((prev: BarcodeConfig) => BarcodeConfig)) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}

export function BarcodeAppearanceConfig({
  barcodeConfig,
  onConfigChange,
  isOpen,
  onOpenChange,
  disabled = false,
}: BarcodeAppearanceConfigProps) {
  const { t } = useTranslation('common');
  const {
    previewDataURL,
    nextPreviewDataURL,
    previewError,
    isGeneratingPreview,
    isPreviewFading,
    previewImageRef,
  } = useBarcodePreview(barcodeConfig);

  const handleConfigChange = (updates: Partial<BarcodeConfig>) => {
    if (typeof onConfigChange === 'function') {
      onConfigChange((prev) => ({ ...prev, ...updates }));
    }
  };

  const isCODE128 =
    barcodeConfig.format === BarcodeFormat.CODE128 ||
    barcodeConfig.format === BarcodeFormat.CODE128A ||
    barcodeConfig.format === BarcodeFormat.CODE128B ||
    barcodeConfig.format === BarcodeFormat.CODE128C;

  const isEAN_UPC =
    barcodeConfig.format === BarcodeFormat.EAN13 ||
    barcodeConfig.format === BarcodeFormat.EAN8 ||
    barcodeConfig.format === BarcodeFormat.EAN5 ||
    barcodeConfig.format === BarcodeFormat.EAN2 ||
    barcodeConfig.format === BarcodeFormat.UPC ||
    barcodeConfig.format === BarcodeFormat.UPCE;

  const handleReset = () => {
    const { marginTop, marginBottom, marginLeft, marginRight, format, ...rest } = barcodeConfig;
    onConfigChange({
      ...rest,
      format,
      width: 2,
      height: 100,
      lineColor: '#000000',
      background: '#FFFFFF',
      margin: 10,
      displayValue: false,
      text: '',
      font: 'monospace',
      fontOptions: '',
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 2,
      fontSize: 20,
      ...(isCODE128 ? { ean128: false } : {}),
      ...(isEAN_UPC ? { flat: false } : {}),
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted transition-colors">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('barcode.appearancePreview')}
              </div>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* 尺寸设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('barcode.width')}: {barcodeConfig.width}px
                </label>
                <Slider
                  value={[barcodeConfig.width]}
                  onValueChange={([value]) =>
                    handleConfigChange({ width: value as number })
                  }
                  max={10}
                  min={1}
                  step={1}
                  disabled={disabled}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('barcode.height')}: {barcodeConfig.height}px
                </label>
                <Slider
                  value={[barcodeConfig.height]}
                  onValueChange={([value]) =>
                    handleConfigChange({ height: value as number })
                  }
                  max={200}
                  min={50}
                  step={10}
                  disabled={disabled}
                  className="w-full"
                />
              </div>
            </div>

            {/* 颜色设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={barcodeConfig.lineColor}
                  onChange={(e) =>
                    handleConfigChange({ lineColor: e.target.value })
                  }
                  disabled={disabled}
                  className="w-7 h-7 rounded border-border cursor-pointer"
                />
                <label className="text-sm font-medium text-foreground">
                  {t('barcode.barcodeColor')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={barcodeConfig.background}
                  onChange={(e) =>
                    handleConfigChange({ background: e.target.value })
                  }
                  disabled={disabled}
                  className="w-7 h-7 rounded border-border cursor-pointer"
                />
                <label className="text-sm font-medium text-foreground">
                  {t('barcode.backgroundColor')}
                </label>
              </div>
            </div>

            <Separator />

            {/* 文字设置 */}
            <div className="space-y-4">
              <h4 className="text-base font-medium text-foreground">
                {t('barcode.textSettings')}
              </h4>

              {/* 显示文本值开关 */}
              <div className="flex items-center space-x-3 pb-2">
                <Switch
                  id="displayValue"
                  checked={barcodeConfig.displayValue ?? false}
                  onCheckedChange={(checked) =>
                    handleConfigChange({ displayValue: checked })
                  }
                  disabled={disabled}
                />
                <label htmlFor="displayValue" className="text-sm font-medium">
                  {t('barcode.displayText')}
                </label>
              </div>

              {/* 文本相关选项 - 仅在显示文本时显示 */}
              {barcodeConfig.displayValue === true && (
                <>
                  {/* 文本覆盖选项 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t('barcode.displayTextLabel')}
                    </label>
                    <Input
                      value={barcodeConfig.text}
                      onChange={(e) =>
                        handleConfigChange({ text: e.target.value })
                      }
                      placeholder={t('barcode.leaveEmptyForBarcodeData')}
                      disabled={disabled}
                    />
                  </div>

                  {/* 字体设置 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t('barcode.font')}
                      </label>
                      <Select
                        value={barcodeConfig.font}
                        onValueChange={(value) =>
                          handleConfigChange({ font: value })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('barcode.selectFont')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monospace">Monospace</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">
                            Times New Roman
                          </SelectItem>
                          <SelectItem value="Courier New">
                            Courier New
                          </SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t('barcode.fontStyle')}
                      </label>
                      <Select
                        value={barcodeConfig.fontOptions || 'default'}
                        onValueChange={(value) =>
                          handleConfigChange({
                            fontOptions: value === 'default' ? '' : value,
                          })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('barcode.selectStyle')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">
                            {t('barcode.default')}
                          </SelectItem>
                          <SelectItem value="bold">{t('barcode.bold')}</SelectItem>
                          <SelectItem value="italic">
                            {t('barcode.italic')}
                          </SelectItem>
                          <SelectItem value="bold italic">
                            {t('barcode.boldItalic')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 文本显示选项 */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t('barcode.textPosition')}
                        </label>
                        <Select
                          value={barcodeConfig.textPosition}
                          onValueChange={(value) =>
                            handleConfigChange({
                              textPosition: value as 'top' | 'bottom',
                            })
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('barcode.selectPosition')}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">{t('barcode.top')}</SelectItem>
                            <SelectItem value="bottom">
                              {t('barcode.bottom')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t('barcode.textAlignment')}
                        </label>
                        <Select
                          value={barcodeConfig.textAlign}
                          onValueChange={(value) =>
                            handleConfigChange({
                              textAlign: value as 'left' | 'center' | 'right',
                            })
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('barcode.selectAlignment')}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">
                              {t('barcode.leftAlign')}
                            </SelectItem>
                            <SelectItem value="center">
                              {t('barcode.center')}
                            </SelectItem>
                            <SelectItem value="right">
                              {t('barcode.rightAlign')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t('barcode.fontSize')}: {barcodeConfig.fontSize}px
                        </label>
                        <Slider
                          value={[barcodeConfig.fontSize]}
                          onValueChange={([value]) =>
                            handleConfigChange({ fontSize: value as number })
                          }
                          max={40}
                          min={10}
                          step={2}
                          disabled={disabled}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t('barcode.textMargin')}: {barcodeConfig.textMargin}px
                        </label>
                        <Slider
                          value={[barcodeConfig.textMargin]}
                          onValueChange={([value]) =>
                            handleConfigChange({ textMargin: value as number })
                          }
                          max={20}
                          min={0}
                          step={1}
                          disabled={disabled}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* 边距选项 */}
            <div className="space-y-4">
              <h4 className="text-base font-medium text-foreground">
                {t('barcode.marginSettings')}
              </h4>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('barcode.margin')}: {barcodeConfig.margin}px
                </label>
                <Slider
                  value={[barcodeConfig.margin]}
                  onValueChange={([value]) => {
                    handleConfigChange({
                      margin: value as number,
                    });
                  }}
                  max={50}
                  min={0}
                  step={1}
                  disabled={disabled}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('barcode.topMargin')}:{' '}
                    {barcodeConfig.marginTop ?? barcodeConfig.margin}px
                  </label>
                  <Slider
                    value={[barcodeConfig.marginTop ?? barcodeConfig.margin]}
                    onValueChange={([value]) => {
                      if (value === barcodeConfig.margin) {
                        const { marginTop, ...rest } = barcodeConfig;
                        handleConfigChange(rest);
                      } else {
                        handleConfigChange({ marginTop: value as number });
                      }
                    }}
                    max={50}
                    min={0}
                    step={1}
                    disabled={disabled}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('barcode.bottomMargin')}:{' '}
                    {barcodeConfig.marginBottom ?? barcodeConfig.margin}px
                  </label>
                  <Slider
                    value={[
                      barcodeConfig.marginBottom ?? barcodeConfig.margin,
                    ]}
                    onValueChange={([value]) => {
                      if (value === barcodeConfig.margin) {
                        const { marginBottom, ...rest } = barcodeConfig;
                        handleConfigChange(rest);
                      } else {
                        handleConfigChange({ marginBottom: value as number });
                      }
                    }}
                    max={50}
                    min={0}
                    step={1}
                    disabled={disabled}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('barcode.leftMargin')}:{' '}
                    {barcodeConfig.marginLeft ?? barcodeConfig.margin}px
                  </label>
                  <Slider
                    value={[barcodeConfig.marginLeft ?? barcodeConfig.margin]}
                    onValueChange={([value]) => {
                      if (value === barcodeConfig.margin) {
                        const { marginLeft, ...rest } = barcodeConfig;
                        handleConfigChange(rest);
                      } else {
                        handleConfigChange({ marginLeft: value as number });
                      }
                    }}
                    max={50}
                    min={0}
                    step={1}
                    disabled={disabled}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('barcode.rightMargin')}:{' '}
                    {barcodeConfig.marginRight ?? barcodeConfig.margin}px
                  </label>
                  <Slider
                    value={[barcodeConfig.marginRight ?? barcodeConfig.margin]}
                    onValueChange={([value]) => {
                      if (value === barcodeConfig.margin) {
                        const { marginRight, ...rest } = barcodeConfig;
                        handleConfigChange(rest);
                      } else {
                        handleConfigChange({ marginRight: value as number });
                      }
                    }}
                    max={50}
                    min={0}
                    step={1}
                    disabled={disabled}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 格式特定选项 - 仅在相关格式时显示 */}
            {(isCODE128 || isEAN_UPC) && (
              <div className="space-y-4">
                <h4 className="text-base font-medium text-foreground">
                  {t('barcode.formatSpecific')}
                </h4>

                {/* CODE128系列选项 */}
                {isCODE128 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={
                          typeof barcodeConfig.ean128 === 'boolean'
                            ? barcodeConfig.ean128
                            : barcodeConfig.ean128 === 'true'
                        }
                        onCheckedChange={(checked) =>
                          handleConfigChange({ ean128: checked })
                        }
                        disabled={disabled}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {t('barcode.gs1128')}
                      </span>
                    </div>
                  </div>
                )}

                {/* EAN/UPC系列选项 */}
                {isEAN_UPC && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={barcodeConfig.flat}
                        onCheckedChange={(checked) =>
                          handleConfigChange({ flat: checked })
                        }
                        disabled={disabled}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {t('barcode.compactFormat')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 预览 */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">
                  {t('barcode.preview')}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={disabled}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground bg-muted/80 hover:bg-muted/60"
                >
                  {t('barcode.resetAllSettings')}
                </Button>
              </div>
              {isGeneratingPreview ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-[13px] text-muted-foreground">
                    {t('barcode.previewing')}
                  </p>
                </div>
              ) : previewError ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                  <p className="text-[13px] text-destructive">{previewError}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {t('barcode.previewText')}:{' '}
                    {barcodeConfig.text ||
                      getPreviewTextByFormat(barcodeConfig.format)}
                  </p>
                </div>
              ) : previewDataURL ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative p-4 bg-background border rounded-lg flex items-center justify-center min-h-[100px] overflow-hidden">
                    {/* 当前显示的图片 */}
                    {previewDataURL && (
                      <img
                        ref={previewImageRef}
                        src={previewDataURL}
                        alt={t('barcode.barcodePreview')}
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
                        alt={t('barcode.barcodePreview')}
                        className={`absolute inset-0 p-4 max-w-full h-auto transition-opacity duration-300 ease-in-out ${
                          isPreviewFading ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ maxHeight: '200px', objectFit: 'contain' }}
                      />
                    )}
                    {/* 加载指示器 */}
                    {isGeneratingPreview && !nextPreviewDataURL && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-background bg-opacity-50 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {t('barcode.previewText')}:{' '}
                    <span className="font-mono">
                      {barcodeConfig.text ||
                        getPreviewTextByFormat(barcodeConfig.format)}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-[13px] text-muted-foreground">
                    {t('barcode.adjustSettingsToSeePreview')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

