'use client';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@teable/ui-lib/dist/shadcn/ui/select';
import { Card, CardContent } from '@teable/ui-lib/dist/shadcn/ui/card';
import { Badge } from '@teable/ui-lib/dist/shadcn/ui/badge';
import { Button } from '@teable/ui-lib/dist/shadcn/ui/button';
import { useFields } from '../../hooks/useFields';
import { IField } from '../../types';
import { FilePack, CheckCircle2 } from '@teable/icons';
import { IConverterConfig } from './types';
import { useState } from 'react';

interface IAttachmentFieldSelectorProps {
  config: IConverterConfig;
  onConfigChange: (config: Partial<IConverterConfig>) => void;
  disabled?: boolean;
  className?: string;
}

export function AttachmentFieldSelector({
  config,
  onConfigChange,
  disabled = false,
  className
}: IAttachmentFieldSelectorProps) {
  const { t } = useTranslation('common');
  const { data: fields = [], isLoading: fieldsLoading } = useFields();
  const [isCreatingField, setIsCreatingField] = useState(false);

  // 过滤出附件字段
  const attachmentFields = fields.filter((field: IField) =>
    field.type === 'attachment'
  );

  const handleFieldChange = (fieldId: string) => {
    onConfigChange({ attachmentFieldId: fieldId });
  };

  const handleCreateField = async () => {
    if (isCreatingField) return;

    setIsCreatingField(true);
    try {
      // 这里应该调用API创建附件字段
      // 暂时使用模拟数据
      const mockFieldId = `fld_${Date.now()}`;

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 创建成功后自动选择该字段
      onConfigChange({ attachmentFieldId: mockFieldId });
    } catch (error) {
      console.error('Error creating attachment field:', error);
    } finally {
      setIsCreatingField(false);
    }
  };

  // 加载状态
  if (fieldsLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-sm text-muted-foreground">
          {t('converter.loadingFields')}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center space-x-3 p-3 border rounded">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 当前选中的字段
  const selectedField = attachmentFields.find(field => field.id === config.attachmentFieldId);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm text-muted-foreground">
        {t('converter.attachmentFieldDescription')}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 字段选择器 */}
            <Select
              value={config.attachmentFieldId || ''}
              onValueChange={handleFieldChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('converter.selectAttachmentFieldPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {attachmentFields.length === 0 ? (
                  <div className="p-3 text-center text-muted-foreground">
                    {t('converter.noAttachmentFields')}
                  </div>
                ) : (
                  attachmentFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      <div className="flex items-center gap-2">
                        <FilePack className="w-4 h-4" />
                        <span>{field.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {t('common.attachmentField')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* 创建新字段按钮 */}
            {attachmentFields.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <FilePack className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-amber-800">
                      {t('converter.tip')}
                    </div>
                    <div className="text-xs text-amber-700 mt-1">
                      {t('converter.createFieldHint')}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreateField}
                  disabled={disabled || isCreatingField}
                  variant="outline"
                  className="w-full"
                >
                  {isCreatingField ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      {t('converter.createAttachmentField')}
                    </>
                  ) : (
                    <>
                      <FilePack className="w-4 h-4 mr-2" />
                      {t('converter.createAttachmentField')}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 选中字段信息 */}
            {selectedField && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-800">
                      {t('converter.selected')}: {selectedField.name}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {t('converter.selectedAttachmentFieldDescription')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}