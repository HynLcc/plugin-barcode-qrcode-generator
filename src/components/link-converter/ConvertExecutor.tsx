'use client';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@teable/ui-lib/dist/shadcn/ui/button';
import { Card, CardContent } from '@teable/ui-lib/dist/shadcn/ui/card';
import { Progress } from '@teable/ui-lib/dist/shadcn/ui/progress';
import { Badge } from '@teable/ui-lib/dist/shadcn/ui/badge';
import { Loader2, Play, CheckCircle2, AlertTriangle, Link, FileText } from '@teable/icons';
import { IConverterConfig, IConversionProgress, ConversionStage } from './types';
import { useToast } from '../../hooks/useToast';
import { useGlobalUrlParams } from '../../hooks/useGlobalUrlParams';
import { LinkConversionService } from '../../services/linkConversionService';

interface IConvertExecutorProps {
  config: IConverterConfig;
  disabled?: boolean;
  onExecuteStart: () => void;
  onExecuteComplete: () => void;
}

export function ConvertExecutor({
  config,
  disabled = false,
  onExecuteStart,
  onExecuteComplete
}: IConvertExecutorProps) {
  const { t } = useTranslation('common');
  const { showSuccess, showError, showWarning } = useToast();
  const urlParams = useGlobalUrlParams();
  const conversionServiceRef = useRef<LinkConversionService | null>(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<IConversionProgress>({
    stage: 'scanning',
    totalUrls: 0,
    processedUrls: 0,
    successfulConversions: 0,
    failedConversions: 0
  });

  // 执行真实的转换过程
  const executeConversion = async () => {
    if (!urlParams.tableId) {
      showError(t('converter.conversionFailed'), 'Table ID not found');
      return;
    }

    setIsExecuting(true);
    onExecuteStart();

    try {
      // 初始化转换服务
      conversionServiceRef.current = new LinkConversionService({
        converterConfig: config,
        tableId: urlParams.tableId,
        viewId: config.viewId || '',
        onProgress: (progress) => {
          setProgress(progress);
        },
        onDownloadProgress: (url, downloadProgress) => {
          console.log(`Download progress for ${url}:`, downloadProgress);
        },
        onUploadProgress: (url, uploadProgress) => {
          console.log(`Upload progress for ${url}:`, uploadProgress);
        },
        onError: (error) => {
          console.error('Conversion error:', error);
          showError('Conversion Error', error);
        }
      });

      // 开始转换
      const result = await conversionServiceRef.current.startConversion();

      // 显示最终结果
      if (result.summary.successfulConversions > 0) {
        showSuccess(
          t('converter.conversionCompleted'),
          t('converter.conversionSuccessDescription', {
            successful: result.summary.successfulConversions,
            total: result.summary.totalUrls
          })
        );
      } else {
        showWarning(
          t('converter.conversionCompleted'),
          'No links were found or successfully converted'
        );
      }

      console.log('Conversion completed:', result);

    } catch (error) {
      console.error('Conversion error:', error);

      setProgress(prev => ({
        ...prev,
        stage: 'error',
        currentFile: t('converter.conversionFailed')
      }));

      showError(
        t('converter.conversionFailed'),
        error instanceof Error ? error.message : t('converter.conversionErrorDescription')
      );
    } finally {
      setIsExecuting(false);
      onExecuteComplete();
      conversionServiceRef.current = null;
    }
  };

  // 取消转换
  const cancelConversion = () => {
    if (conversionServiceRef.current) {
      conversionServiceRef.current.cancelConversion();
      setIsExecuting(false);
      onExecuteComplete();

      showWarning('Conversion Cancelled', 'The conversion process has been cancelled');
    }
  };

  // 获取阶段显示信息
  const getStageInfo = (stage: ConversionStage) => {
    switch (stage) {
      case 'scanning':
        return {
          label: t('converter.scanningUrls'),
          icon: <FileText className="w-4 h-4" />,
          color: 'text-blue-600'
        };
      case 'downloading':
        return {
          label: t('converter.downloadingFiles'),
          icon: <Link className="w-4 h-4" />,
          color: 'text-blue-600'
        };
      case 'uploading':
        return {
          label: t('converter.uploadingAttachments'),
          icon: <FileText className="w-4 h-4" />,
          color: 'text-blue-600'
        };
      case 'completed':
        return {
          label: t('converter.conversionCompleted'),
          icon: <CheckCircle2 className="w-4 h-4" />,
          color: 'text-green-600'
        };
      case 'error':
        return {
          label: t('converter.conversionFailed'),
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'text-red-600'
        };
      default:
        return {
          label: '',
          icon: null,
          color: ''
        };
    }
  };

  // 计算总体进度
  const getOverallProgress = () => {
    if (progress.totalUrls === 0) return 0;

    const stageWeight = {
      scanning: 10,
      downloading: 70,
      uploading: 15,
      completed: 100,
      error: progress.processedUrls > 0 ? 50 : 0
    };

    switch (progress.stage) {
      case 'scanning':
        return 5;
      case 'downloading':
        return 10 + (progress.processedUrls / progress.totalUrls) * 70;
      case 'uploading':
        return 85;
      case 'completed':
        return 100;
      case 'error':
        return stageWeight.error;
      default:
        return 0;
    }
  };

  const stageInfo = getStageInfo(progress.stage);
  const overallProgress = getOverallProgress();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={executeConversion}
          disabled={disabled || isExecuting}
          className="flex-1 max-w-md"
          size="lg"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('converter.converting')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              {t('converter.startConversion')}
            </>
          )}
        </Button>

        {isExecuting && (
          <Button
            onClick={cancelConversion}
            variant="outline"
            size="lg"
            className="px-6"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
        )}
      </div>

      {/* 进度显示 */}
      {isExecuting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* 当前阶段 */}
              <div className="flex items-center gap-3">
                {stageInfo.icon}
                <span className={`font-medium ${stageInfo.color}`}>
                  {stageInfo.label}
                </span>
                {progress.currentFile && (
                  <Badge variant="outline" className="text-xs">
                    {progress.currentFile}
                  </Badge>
                )}
              </div>

              {/* 总体进度条 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('converter.overallProgress')}</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="w-full" />
              </div>

              {/* 详细统计 */}
              {progress.stage !== 'scanning' && progress.totalUrls > 0 && (
                <div className="grid grid-cols-3 gap-4 text-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-lg font-semibold text-blue-600">
                      {progress.processedUrls}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('converter.processed')}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      {progress.successfulConversions}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('converter.successful')}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">
                      {progress.failedConversions}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('converter.failed')}
                    </div>
                  </div>
                </div>
              )}

              {/* 当前文件下载进度 */}
              {progress.stage === 'downloading' && progress.downloadProgress !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('converter.currentFileProgress')}</span>
                    <span>{progress.downloadProgress}%</span>
                  </div>
                  <Progress value={progress.downloadProgress} className="w-full" />
                </div>
              )}

              {/* 提示信息 */}
              {progress.stage === 'error' && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('converter.conversionErrorHint')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}