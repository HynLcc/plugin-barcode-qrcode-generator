'use client';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@teable/ui-lib/dist/shadcn/ui/card';
import { Label } from '@teable/ui-lib/dist/shadcn/ui/label';
import { Checkbox } from '@teable/ui-lib/dist/shadcn/ui/checkbox';
import { Slider } from '@teable/ui-lib/dist/shadcn/ui/slider';
import { Separator } from '@teable/ui-lib/dist/shadcn/ui/separator';
import { Settings, FileText, CheckCircle2 } from '@teable/icons';
import { IConverterConfig, FileTypeCategory, FILE_TYPE_CATEGORIES } from './types';

interface IConverterConfigProps {
  config: IConverterConfig;
  onConfigChange: (config: Partial<IConverterConfig>) => void;
  disabled?: boolean;
  className?: string;
}

export function ConverterConfig({
  config,
  onConfigChange,
  disabled = false,
  className
}: IConverterConfigProps) {
  const { t } = useTranslation('common');

  const handleFileTypeToggle = (fileType: FileTypeCategory, checked: boolean) => {
    let newAllowedFileTypes: FileTypeCategory[];

    if (checked) {
      newAllowedFileTypes = [...config.allowedFileTypes, fileType];
    } else {
      newAllowedFileTypes = config.allowedFileTypes.filter(type => type !== fileType);
    }

    onConfigChange({
      allowedFileTypes: newAllowedFileTypes,
      allowAllFileTypes: newAllowedFileTypes.length === 0
    });
  };

  const formatFileSize = (mb: number) => {
    if (mb >= 1000) {
      return `${(mb / 1000).toFixed(1)}GB`;
    }
    return `${mb}MB`;
  };

  const getConcurrencyLabel = (value: number) => {
    switch (value) {
      case 1:
        return t('converter.sequential');
      case 3:
        return t('converter.highConcurrency');
      default:
        return `${value} ${t('converter.concurrencyLimit')}`;
    }
  };

  const getFileTypeIcon = (type: FileTypeCategory) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'document':
        return '📄';
      case 'media':
        return '🎬';
      case 'archive':
        return '📦';
      default:
        return '📁';
    }
  };

  const getFileTypeLabel = (type: FileTypeCategory) => {
    switch (type) {
      case 'image':
        return t('converter.imageFiles');
      case 'document':
        return t('converter.documentFiles');
      case 'media':
        return t('converter.mediaFiles');
      case 'archive':
        return t('converter.archiveFiles');
      default:
        return t('converter.otherOptions');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 文件大小限制 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            {t('converter.fileSizeLimit')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('converter.maxFileSize')}: {formatFileSize(config.maxFileSize)}</Label>
            <Slider
              value={[config.maxFileSize]}
              onValueChange={([value]) => onConfigChange({ maxFileSize: value as number })}
              max={500}
              min={1}
              step={1}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1MB</span>
              <span>100MB</span>
              <span>500MB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 并发设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5" />
            {t('converter.concurrencySettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{getConcurrencyLabel(config.concurrencyLimit)}</Label>
            <Slider
              value={[config.concurrencyLimit]}
              onValueChange={([value]) => onConfigChange({ concurrencyLimit: value as number })}
              max={10}
              min={1}
              step={1}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('converter.sequential')}</span>
              <span>5</span>
              <span>{t('converter.highConcurrency')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 文件类型设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5" />
            {t('converter.fileTypeSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 允许所有文件类型 */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="allowAllTypes"
              checked={config.allowAllFileTypes}
              onCheckedChange={(checked) =>
                onConfigChange({
                  allowAllFileTypes: checked as boolean,
                  allowedFileTypes: checked ? [] : ['image', 'document', 'media']
                })
              }
              disabled={disabled}
            />
            <div className="space-y-1">
              <Label htmlFor="allowAllTypes" className="font-medium">
                {t('converter.allowAllFileTypes')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('converter.allowAllFileTypesWarning')}
              </p>
            </div>
          </div>

          <Separator />

          {/* 文件类型选择 */}
          {!config.allowAllFileTypes && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('converter.allowedFileTypes')}</Label>
              <div className="grid grid-cols-2 gap-3">
                {FILE_TYPE_CATEGORIES.filter(type => type !== 'other').map((fileType) => {
                  const isChecked = config.allowedFileTypes.includes(fileType as FileTypeCategory);
                  return (
                    <div
                      key={fileType}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox
                        id={`filetype-${fileType}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleFileTypeToggle(fileType as FileTypeCategory, checked as boolean)
                        }
                        disabled={disabled}
                      />
                      <Label
                        htmlFor={`filetype-${fileType}`}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <span className="text-lg">{getFileTypeIcon(fileType as FileTypeCategory)}</span>
                        <span className="text-sm">{getFileTypeLabel(fileType as FileTypeCategory)}</span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 其他选项 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5" />
            {t('converter.otherOptions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 保留原始链接 */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="preserveLink"
              checked={config.preserveOriginalLink}
              onCheckedChange={(checked) =>
                onConfigChange({ preserveOriginalLink: checked as boolean })
              }
              disabled={disabled}
            />
            <div className="space-y-1">
              <Label htmlFor="preserveLink" className="font-medium">
                {t('converter.preserveOriginalLink')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('converter.preserveOriginalLinkDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}