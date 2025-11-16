'use client';

import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@teable/ui-lib/shadcn';
import { Settings, ChevronDown, ChevronUp } from '@teable/icons';
import { BarcodeFormat, OutputFormat, BarcodeGenerator as BarcodeGeneratorClass } from '@/utils/barcodeGenerator';
import { BarcodeConfig } from '@/types/barcodeGenerator';
import { FieldSelector } from './FieldSelector';

interface BarcodeBasicConfigProps {
  barcodeConfig: BarcodeConfig;
  onConfigChange: (config: Partial<BarcodeConfig>) => void;
  selectedViewId: string;
  selectedUrlField: string;
  selectedAttachmentField: string;
  onViewChange: (viewId: string) => void;
  onUrlFieldChange: (fieldId: string) => void;
  onAttachmentFieldChange: (fieldId: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}

export function BarcodeBasicConfig({
  barcodeConfig,
  onConfigChange,
  selectedViewId,
  selectedUrlField,
  selectedAttachmentField,
  onViewChange,
  onUrlFieldChange,
  onAttachmentFieldChange,
  isOpen,
  onOpenChange,
  disabled = false,
}: BarcodeBasicConfigProps) {
  const { t } = useTranslation('common');
  const supportedFormats = BarcodeGeneratorClass.getSupportedFormats();

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted transition-colors">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('barcode.basicSettings')}
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
            {/* 条形码格式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('barcode.barcodeType')}
              </label>
              <Select
                value={barcodeConfig.format}
                onValueChange={(value) => {
                  const newFormat = value as BarcodeFormat;
                  // onConfigChange会处理format变更时的text清空逻辑
                  onConfigChange({ format: newFormat });
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('barcode.selectBarcodeType')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {supportedFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 输出格式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('barcode.fileFormat')}
              </label>
              <Select
                value={barcodeConfig.outputFormat}
                onValueChange={(value) =>
                  onConfigChange({ outputFormat: value as OutputFormat })
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('barcode.selectFileFormat')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OutputFormat.PNG}>PNG</SelectItem>
                  <SelectItem value={OutputFormat.SVG}>SVG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 数据源 */}
            <FieldSelector
              selectedViewId={selectedViewId}
              selectedUrlField={selectedUrlField}
              selectedAttachmentField={selectedAttachmentField}
              onViewChange={onViewChange}
              onUrlFieldChange={onUrlFieldChange}
              onAttachmentFieldChange={onAttachmentFieldChange}
              disabled={disabled}
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

