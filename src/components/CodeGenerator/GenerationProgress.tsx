'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, Progress } from '@teable/ui-lib/shadcn';
import { Settings } from '@teable/icons';

interface GenerationProgressProps {
  isConverting: boolean;
  progress: number;
  stats: {
    success: number;
    failed: number;
    processing: number;
  };
}

export function GenerationProgress({
  isConverting,
  progress,
  stats,
}: GenerationProgressProps) {
  const { t } = useTranslation('common');

  if (!isConverting && stats.success === 0 && stats.failed === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              {t('barcode.generationProgress')}
            </h3>
          </div>

          {isConverting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('barcode.progress')}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {stats.success > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {t('barcode.successful')}
                  </div>
                  <div className="text-base font-semibold text-green-600 dark:text-green-400">
                    {stats.success}
                    {t('barcode.countUnit')}
                  </div>
                </div>
              </div>
            )}

            {stats.failed > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {t('barcode.failed')}
                  </div>
                  <div className="text-base font-semibold text-red-600 dark:text-red-400">
                    {stats.failed}
                    {t('barcode.countUnit')}
                  </div>
                </div>
              </div>
            )}

            {stats.processing > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {t('barcode.processing')}
                  </div>
                  <div className="text-base font-semibold text-blue-600 dark:text-blue-400">
                    {stats.processing}
                    {t('barcode.countUnit')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

