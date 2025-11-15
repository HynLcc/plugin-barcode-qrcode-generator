'use client';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@teable/ui-lib/dist/shadcn/ui/checkbox';
import { Label } from '@teable/ui-lib/dist/shadcn/ui/label';
import { Card, CardContent } from '@teable/ui-lib/dist/shadcn/ui/card';
import { Badge } from '@teable/ui-lib/dist/shadcn/ui/badge';
import { useFields } from '../../hooks/useFields';
import { IField } from '../../types';
import { FileText, Hash, Link } from '@teable/icons';
import { IConverterConfig, IUrlDetectionResult } from './types';
import { useEffect, useState } from 'react';

interface IUrlFieldSelectorProps {
  config: IConverterConfig;
  onConfigChange: (config: Partial<IConverterConfig>) => void;
  disabled?: boolean;
  className?: string;
}

export function UrlFieldSelector({
  config,
  onConfigChange,
  disabled = false,
  className
}: IUrlFieldSelectorProps) {
  const { t } = useTranslation('common');
  const { data: fields = [], isLoading: fieldsLoading } = useFields();
  const [detectionResults, setDetectionResults] = useState<IUrlDetectionResult[]>([]);

  // 过滤出文本类型字段（支持多种文本字段类型）
  const textFields = fields.filter((field: IField) => {
    const cellValueType = field.cellValueType;
    const type = field.type;

    // 支持的文本字段类型
    const supportedTypes = [
      'singleLineText',    // 单行文本
      'multipleLineText',  // 多行文本
      'singleText',        // 单行文本 (cellValueType)
      'multipleText',      // 多行文本 (cellValueType)
      'text',              // 通用文本
      'url',               // URL字段
      'email',             // 邮箱字段
      'phone',             // 电话字段
      'richText',          // 富文本
      'longText'           // 长文本
    ];

    return supportedTypes.includes(cellValueType) || supportedTypes.includes(type);
  });


  // 检测字段中的URL
  const detectUrlsInField = async (field: IField): Promise<IUrlDetectionResult> => {
    try {
      // 这里应该调用API来获取字段数据并检测URL
      // 暂时返回模拟数据
      const mockUrlCount = field.name.toLowerCase().includes('link') ||
                          field.name.toLowerCase().includes('url') ||
                          field.name.toLowerCase().includes('网址') ||
                          field.name.toLowerCase().includes('链接') ? Math.floor(Math.random() * 20) + 1 : 0;

      const mockUrls = mockUrlCount > 0 ? [
        'https://example.com/file1.pdf',
        'https://example.com/image2.jpg',
        'https://www.sample.com/document.docx'
      ].slice(0, Math.min(3, mockUrlCount)) : [];

      return {
        fieldId: field.id,
        fieldName: field.name,
        urlCount: mockUrlCount,
        sampleUrls: mockUrls
      };
    } catch (error) {
      console.error(`Error detecting URLs in field ${field.name}:`, error);
      return {
        fieldId: field.id,
        fieldName: field.name,
        urlCount: 0,
        sampleUrls: []
      };
    }
  };

  // 当字段数据加载完成后，检测URL
  useEffect(() => {
    if (textFields.length > 0 && !fieldsLoading) {
      const detectAllUrls = async () => {
        const results = await Promise.all(
          textFields.map(field => detectUrlsInField(field))
        );
        setDetectionResults(results);
      };
      detectAllUrls();
    }
  }, [textFields, fieldsLoading]);

  // 处理字段选择变化
  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    const newUrlFieldIds = checked
      ? [...config.urlFieldIds, fieldId]
      : config.urlFieldIds.filter(id => id !== fieldId);

    console.log('🔗 [UrlFieldSelector] Field selection changed:', {
      fieldId,
      checked,
      totalSelected: newUrlFieldIds.length
    });

    onConfigChange({ urlFieldIds: newUrlFieldIds });
  };

  // 获取字段图标
  const getFieldIcon = (field: IField) => {
    const iconClassName = "w-4 h-4";
    const cellValueType = field.cellValueType;
    const type = field.type;

    // 优先使用 cellValueType，如果没有则使用 type
    const fieldType = cellValueType || type;

    switch (fieldType) {
      case 'singleLineText':
      case 'singleText':
      case 'multipleLineText':
      case 'multipleText':
      case 'longText':
      case 'text':
      case 'richText':
        return <FileText className={iconClassName} />;
      case 'url':
        return <Link className={iconClassName} />;
      case 'email':
        return <FileText className={iconClassName} />;
      case 'phone':
        return <FileText className={iconClassName} />;
      default:
        return <Hash className={iconClassName} />;
    }
  };

  // 获取字段类型显示名称
  const getFieldTypeLabel = (field: IField) => {
    const cellValueType = field.cellValueType;
    const type = field.type;

    // 优先使用 cellValueType，如果没有则使用 type
    const fieldType = cellValueType || type;

    switch (fieldType) {
      case 'singleLineText':
      case 'singleText':
        return t('converter.singleLineText');
      case 'multipleLineText':
      case 'multipleText':
      case 'longText':
        return t('converter.multipleLineText');
      case 'url':
        return 'URL';
      case 'email':
        return 'Email';
      case 'phone':
        return 'Phone';
      case 'richText':
        return 'Rich Text';
      case 'text':
        return 'Text';
      default:
        return fieldType || type || 'Unknown';
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
              {[1, 2, 3].map(i => (
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

  // 无文本字段
  if (textFields.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-sm text-destructive">
          {t('converter.noTextFields')}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm text-muted-foreground">
        {t('converter.urlFieldDescription')}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {textFields.map((field) => {
              const detectionResult = detectionResults.find(r => r.fieldId === field.id);
              const isSelected = config.urlFieldIds.includes(field.id);
              const hasUrls = (detectionResult?.urlCount || 0) > 0;

              return (
                <div
                  key={field.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                    isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    id={`field-${field.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleFieldToggle(field.id, checked as boolean)}
                    disabled={disabled}
                  />

                  <div className="flex items-center space-x-2 flex-1">
                    {getFieldIcon(field)}
                    <div className="flex-1">
                      <Label
                        htmlFor={`field-${field.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {field.name}
                      </Label>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Badge variant="outline">
                          {getFieldTypeLabel(field)}
                        </Badge>
                        {hasUrls && (
                          <Badge variant="secondary">
                            {detectionResult?.urlCount} {t('converter.urlsFound')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {hasUrls && (
                    <div className="text-xs text-muted-foreground max-w-xs truncate">
                      {detectionResult?.sampleUrls[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {config.urlFieldIds.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('converter.selectedFields', { count: config.urlFieldIds.length })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}