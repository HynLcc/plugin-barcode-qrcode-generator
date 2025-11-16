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
import { QRErrorCorrectionLevel, QRCodeGenerator, IQRCodeOptions } from '@/utils/qrCodeGenerator';
import { FieldSelector } from './FieldSelector';

interface QRCodeBasicConfigProps {
  qrConfig: IQRCodeOptions;
  onConfigChange: (config: Partial<IQRCodeOptions>) => void;
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

export function QRCodeBasicConfig({
  qrConfig,
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
}: QRCodeBasicConfigProps) {
  const { t } = useTranslation('common');
  const supportedErrorCorrectionLevels =
    QRCodeGenerator.getSupportedErrorCorrectionLevels();

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted transition-colors">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
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
            {/* 错误纠正级别 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('qrcode.errorCorrectionLevel')}
              </label>
              <Select
                value={qrConfig.errorCorrectionLevel || QRErrorCorrectionLevel.H}
                onValueChange={(value) =>
                  onConfigChange({
                    errorCorrectionLevel: value as QRErrorCorrectionLevel,
                  })
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('qrcode.selectErrorCorrectionLevel')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {supportedErrorCorrectionLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <span>{level.label}</span>
                        {level.value === QRErrorCorrectionLevel.H && (
                          <span className="text-xs text-primary font-medium">
                            {t('qrcode.recommended')}
                          </span>
                        )}
                      </div>
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
                value={qrConfig.type || 'png'}
                onValueChange={(value) =>
                  onConfigChange({ type: value as 'svg' | 'png' })
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('barcode.selectFileFormat')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 数据源配置 */}
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

