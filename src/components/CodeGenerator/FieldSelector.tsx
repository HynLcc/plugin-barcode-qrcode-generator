'use client';

import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@teable/ui-lib/shadcn';
import { File } from '@teable/icons';
import { RequireCom } from '@/utils/barcodeHelpers';
import { useFieldData } from '@/hooks/useFieldData';

interface FieldSelectorProps {
  selectedViewId: string;
  selectedUrlField: string;
  selectedAttachmentField: string;
  onViewChange: (viewId: string) => void;
  onUrlFieldChange: (fieldId: string) => void;
  onAttachmentFieldChange: (fieldId: string) => void;
  disabled?: boolean;
}

export function FieldSelector({
  selectedViewId,
  selectedUrlField,
  selectedAttachmentField,
  onViewChange,
  onUrlFieldChange,
  onAttachmentFieldChange,
  disabled = false,
}: FieldSelectorProps) {
  const { t } = useTranslation('common');
  const {
    views,
    sourceFields,
    attachmentFields,
    getViewIcon,
    getFieldIcon,
  } = useFieldData();

  return (
    <div className="space-y-4">
      {/* 选择视图 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          <RequireCom />
          {t('barcode.selectView')}
        </label>
        <Select
          value={selectedViewId}
          onValueChange={onViewChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('barcode.selectViewPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {views.length === 0 ? (
              <SelectItem value="no-views" disabled>
                {t('barcode.noViewsFound')}
              </SelectItem>
            ) : (
              views.map((view) => (
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
        <label className="text-sm font-medium text-foreground">
          <RequireCom />
          {t('barcode.dataSourceField')}
        </label>
        <Select
          value={selectedUrlField}
          onValueChange={onUrlFieldChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('barcode.selectFieldPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {sourceFields.length === 0 ? (
              <SelectItem value="no-fields" disabled>
                {t('barcode.noDataFieldsFound')}
              </SelectItem>
            ) : (
              sourceFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  <div className="flex items-center gap-2">
                    {getFieldIcon(field.type, field.cellValueType)}
                    <span>{field.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 选择附件字段 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          <RequireCom />
          {t('barcode.selectAttachmentField')}
        </label>
        <Select
          value={selectedAttachmentField}
          onValueChange={onAttachmentFieldChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('barcode.selectFieldPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {attachmentFields.length === 0 ? (
              <SelectItem value="no-fields" disabled>
                {t('barcode.noAttachmentFieldsFound')}
              </SelectItem>
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
    </div>
  );
}

