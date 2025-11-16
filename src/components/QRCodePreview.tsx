'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QRErrorCorrectionLevel } from '@/utils/qrCodeGenerator';
import { AlertCircle } from '@teable/icons';

/**
 * QR码预览组件Props接口
 */
interface QRCodePreviewProps {
  /** 要编码的数据 */
  value: string;
  /** QR码尺寸（正方形） */
  size?: number;
  /** 前景色 */
  fgColor?: string;
  /** 背景色 */
  bgColor?: string;
  /** 错误纠正级别 */
  level?: QRErrorCorrectionLevel;
  /** 是否包含边距 */
  includeMargin?: boolean;
  /** 自定义CSS类名 */
  className?: string;
}

/**
 * QR码预览组件
 * 实时生成并显示QR码预览
 */
export const QRCodePreview: React.FC<QRCodePreviewProps> = ({
  value,
  size = 256,
  fgColor = '#000000',
  bgColor = '#FFFFFF',
  level = QRErrorCorrectionLevel.M,
  includeMargin = true,
  className
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateSVG = async () => {
      if (!value) {
        setSvgContent('');
        setError('');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const qrOptions = {
          errorCorrectionLevel: level || 'M',
          width: size,
          margin: includeMargin ? 4 : 0,
          color: {
            dark: fgColor || '#000000',
            light: bgColor || '#FFFFFF'
          }
        };

        // 使用 qrcode 库生成 SVG
        const svgString = await QRCode.toString(value, {
          ...qrOptions,
          type: 'svg'
        });

        setSvgContent(svgString);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        console.error('QR Code generation error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    generateSVG();
  }, [value, size, fgColor, bgColor, level, includeMargin]);

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 space-y-2 ${className || ''}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-[13px] text-muted-foreground">生成中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 space-y-2 ${className || ''}`}>
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-[13px] text-destructive">{error}</p>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className || ''}`}>
        <p className="text-[13px] text-muted-foreground">请输入数据以查看预览</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-3 ${className || ''}`}>
      <div className="relative p-4 bg-background border rounded-lg flex items-center justify-center overflow-hidden">
        <div
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{
            maxWidth: '100%',
            maxHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </div>
      <p className="text-[13px] text-muted-foreground">
        预览数据: <span className="font-mono">{value}</span>
      </p>
    </div>
  );
};

