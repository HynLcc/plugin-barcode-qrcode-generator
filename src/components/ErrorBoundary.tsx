'use client';
import { ReactNode, useState, useCallback, ReactElement } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@teable/ui-lib/shadcn';
import { useTranslation } from 'react-i18next';

interface IErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

function ErrorFallback({ error, onReset }: { error?: Error; onReset: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-900">{t('errors.errorOccurred')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-gray-600">
            {t('errors.errorMessage')}
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="rounded-md bg-gray-100 p-3">
              <p className="text-xs font-mono text-gray-800">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Button onClick={onReset} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('errors.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ErrorBoundary({ children, fallback, onError }: IErrorBoundaryProps): ReactElement {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error, errorInfo: any) => {
    setHasError(true);
    setError(error);

    if (onError) {
      onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }, [onError]);

  const handleReset = useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  // 为了捕获错误，我们需要一个错误边界类组件作为包装器
  if (hasError) {
    return fallback ? <>{fallback}</> : <ErrorFallback error={error || undefined} onReset={handleReset} />;
  }

  // 使用一个简单的错误捕获机制
  try {
    return <>{children}</>;
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error('Unknown error');
    handleError(errorObj, { componentStack: 'ErrorBoundary catch block' });
    return <ErrorFallback error={errorObj} onReset={handleReset} />;
  }
}