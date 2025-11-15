'use client';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@teable/ui-lib/dist/shadcn/ui/select';
import { Card, CardContent } from '@teable/ui-lib/dist/shadcn/ui/card';
import { useViews } from '../../hooks/useViews';
import { IConverterConfig } from './types';
import { IView } from '../../types';

interface IViewSelectorProps {
  config: IConverterConfig;
  onConfigChange: (config: Partial<IConverterConfig>) => void;
  disabled?: boolean;
  className?: string;
}

export function ViewSelector({
  config,
  onConfigChange,
  disabled = false,
  className
}: IViewSelectorProps) {
  const { t } = useTranslation('common');
  const { data: views = [], isLoading: viewsLoading } = useViews();
  
  // 确保 views 是数组类型
  const viewsArray: IView[] = Array.isArray(views) ? views : [];

  const handleViewChange = (viewId: string) => {
    const finalViewId = viewId === 'all' ? undefined : viewId;
    onConfigChange(finalViewId ? { viewId: finalViewId } : {});
  };

  // 加载状态
  if (viewsLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-sm text-muted-foreground">
          {t('converter.loadingViews')}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 border rounded">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 无视图
  if (viewsArray.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-sm text-destructive">
          {t('converter.noViews')}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm text-muted-foreground">
        {t('converter.viewDescription')}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Select
            value={config.viewId || 'all'}
            onValueChange={handleViewChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('converter.selectViewPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('converter.selectView')}</SelectItem>
              {viewsArray.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  <div className="flex items-center gap-2">
                    <span>{view.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({t(`converter.viewType.${view.type as string}`)})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}