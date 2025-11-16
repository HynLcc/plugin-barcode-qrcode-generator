import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useViews } from './useViews';
import { useGlobalUrlParams } from './useGlobalUrlParams';
import * as openApi from '@teable/openapi';
import {
  Sheet,
  ClipboardList as Form,
  LayoutGrid as Gallery,
  Kanban,
  Calendar,
  A,
  LongText,
  Hash,
} from '@teable/icons';
import { IView } from '@/types';

export function useFieldData() {
  const { tableId } = useGlobalUrlParams();
  const { data: views = [], isLoading: viewsLoading } = useViews();
  const viewsArray: IView[] = Array.isArray(views) ? views : [];

  const { data: fields, isLoading: fieldsLoading } = useQuery({
    queryKey: ['table-fields', tableId],
    queryFn: async () => {
      if (!tableId) return [];
      const { data } = await openApi.getFields(tableId);
      return data;
    },
    enabled: !!tableId,
  });

  // Filter fields by type (memoized for performance)
  const textFields = useMemo(
    () =>
      fields?.filter(
        (field) => field.type === 'longText' || field.type === 'singleLineText'
      ) || [],
    [fields]
  );

  // 获取数字内容的字段
  const numericFields = useMemo(
    () =>
      fields?.filter((field) => field.cellValueType === 'number') || [],
    [fields]
  );

  // 合并文本和数字字段作为数据源字段
  const sourceFields = useMemo(
    () => [...textFields, ...numericFields],
    [textFields, numericFields]
  );

  const attachmentFields = useMemo(
    () => fields?.filter((field) => field.type === 'attachment') || [],
    [fields]
  );

  // Get view icon based on view type (memoized)
  const getViewIcon = useCallback((viewType: string) => {
    const iconClassName = 'w-4 h-4';

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
  const getFieldIcon = useCallback(
    (fieldType: string, cellValueType?: string) => {
      const type = fieldType?.toLowerCase() || '';
      const cellType = cellValueType?.toLowerCase() || '';

      // 检查字段类型
      if (
        type === 'singlelinetext' ||
        cellType === 'singlelinetext' ||
        type === 'a'
      ) {
        return <A className="w-4 h-4" />;
      }
      if (type === 'longtext' || cellType === 'longtext') {
        return <LongText className="w-4 h-4" />;
      }
      if (cellType === 'number' || type === 'number') {
        return <Hash className="w-4 h-4" />;
      }

      return <A className="w-4 h-4" />; // 默认图标
    },
    []
  );

  return {
    fields,
    fieldsLoading,
    views: viewsArray,
    viewsLoading,
    textFields,
    numericFields,
    sourceFields,
    attachmentFields,
    getViewIcon,
    getFieldIcon,
  };
}

