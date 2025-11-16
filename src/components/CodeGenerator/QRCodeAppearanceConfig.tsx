'use client';

import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Slider,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@teable/ui-lib/shadcn';
import { Settings, ChevronDown, ChevronUp } from '@teable/icons';
import { QRErrorCorrectionLevel, IQRCodeOptions } from '@/utils/qrCodeGenerator';
import { QRCodePreview } from '@/components/QRCodePreview';

interface QRCodeAppearanceConfigProps {
  qrConfig: IQRCodeOptions;
  onConfigChange: (config: Partial<IQRCodeOptions>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}

export function QRCodeAppearanceConfig({
  qrConfig,
  onConfigChange,
  isOpen,
  onOpenChange,
  disabled = false,
}: QRCodeAppearanceConfigProps) {
  const { t } = useTranslation('common');

  const handleReset = () => {
    onConfigChange({
      errorCorrectionLevel: QRErrorCorrectionLevel.H,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      type: 'png',
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('qrcode.size')}: {qrConfig.width || 256}px
              </label>
              <Slider
                value={[qrConfig.width || 256]}
                onValueChange={([value]) =>
                  onConfigChange({ width: value as number })
                }
                max={512}
                min={50}
                step={10}
                disabled={disabled}
                className="w-full"
              />
            </div>

            {/* 颜色设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={qrConfig.color?.dark || '#000000'}
                  onChange={(e) =>
                    onConfigChange({
                      color: {
                        ...qrConfig.color,
                        dark: e.target.value,
                        light: qrConfig.color?.light || '#FFFFFF',
                      },
                    })
                  }
                  disabled={disabled}
                  className="w-7 h-7 rounded border-border cursor-pointer"
                />
                <label className="text-sm font-medium text-foreground">
                  {t('qrcode.foregroundColor')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={qrConfig.color?.light || '#FFFFFF'}
                  onChange={(e) =>
                    onConfigChange({
                      color: {
                        ...qrConfig.color,
                        dark: qrConfig.color?.dark || '#000000',
                        light: e.target.value,
                      },
                    })
                  }
                  disabled={disabled}
                  className="w-7 h-7 rounded border-border cursor-pointer"
                />
                <label className="text-sm font-medium text-foreground">
                  {t('qrcode.backgroundColor')}
                </label>
              </div>
            </div>

            <Separator />

            {/* 预览 */}
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
              <QRCodePreview
                value="teable.ai"
                size={qrConfig.width || 256}
                fgColor={qrConfig.color?.dark || '#000000'}
                bgColor={qrConfig.color?.light || '#FFFFFF'}
                level={qrConfig.errorCorrectionLevel || QRErrorCorrectionLevel.H}
                includeMargin={true}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

