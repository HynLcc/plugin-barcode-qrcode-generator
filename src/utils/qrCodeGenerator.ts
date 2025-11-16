/**
 * QR码生成工具
 * 使用 qrcode 库将文本内容转换为QR码图片
 */

import QRCode from 'qrcode';

/**
 * QR码错误纠正级别
 */
export enum QRErrorCorrectionLevel {
  L = 'L', // 低 - ~7% 纠错，最高容量
  M = 'M', // 中 - ~15% 纠错，良好平衡
  Q = 'Q', // 四分之一 - ~25% 纠错，更好可靠性
  H = 'H'  // 高 - ~30% 纠错，最高可靠性
}

/**
 * QR码生成选项接口（基于5项用户配置）
 */
export interface IQRCodeOptions {
  /** 1. 错误纠正级别 */
  errorCorrectionLevel?: QRErrorCorrectionLevel;
  /** 2. 尺寸设置（使用width，QR码是正方形） */
  width?: number;
  /** 3. 颜色配置 */
  color?: {
    dark?: string;   // 前景色
    light?: string;  // 背景色
  };
  /** 4. 边距设置 */
  margin?: number;
  /** 5. 输出格式 */
  type?: 'svg' | 'png';
}

/**
 * QR码生成结果接口
 */
export interface IQRCodeResult {
  originalData: string;
  success: boolean;
  blob?: Blob;
  dataURL?: string;
  fileName?: string;
  fileSize?: number;
  duration: number;
  error?: string;
  errorCorrectionLevel?: QRErrorCorrectionLevel;
  size?: number;
}

/**
 * 默认QR码选项
 */
const DEFAULT_QRCODE_OPTIONS: Required<Omit<IQRCodeOptions, 'type'>> & { type: 'svg' | 'png' } = {
  errorCorrectionLevel: QRErrorCorrectionLevel.M,
  width: 256,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  margin: 4,
  type: 'svg'
};

/**
 * QR码生成器类
 */
export class QRCodeGenerator {
  private defaultOptions: IQRCodeOptions;

  constructor(defaultOptions: IQRCodeOptions = {}) {
    this.defaultOptions = { ...DEFAULT_QRCODE_OPTIONS, ...defaultOptions };
  }

  /**
   * 生成QR码
   * @param data 要编码的数据
   * @param options QR码配置
   * @param fileName 文件名（可选）
   * @returns 生成结果
   */
  async generateQRCode(
    data: string,
    options: IQRCodeOptions = {},
    fileName?: string
  ): Promise<IQRCodeResult> {
    const startTime = Date.now();
    const result: IQRCodeResult = {
      originalData: data,
      success: false,
      duration: 0
    };

    try {
      // 验证输入
      if (!data || typeof data !== 'string') {
        throw new Error('Data is required and must be a string');
      }

      // 合并配置
      const mergedOptions = { ...this.defaultOptions, ...options };
      const {
        errorCorrectionLevel,
        width,
        color,
        margin,
        type
      } = mergedOptions;

      let blob: Blob;
      let dataURL: string;
      let finalFileName: string;

      if (type === 'svg') {
        // 生成 SVG 格式
        const svgString = await QRCode.toString(data, {
          errorCorrectionLevel: errorCorrectionLevel || 'M',
          width: width || 256,
          margin: margin ?? 4,
          color: {
            dark: color?.dark || '#000000',
            light: color?.light || '#FFFFFF'
          },
          type: 'svg'
        });

        // 创建 Blob
        blob = new Blob([svgString], { type: 'image/svg+xml' });
        
        // 生成 DataURL
        dataURL = `data:image/svg+xml;base64,${btoa(svgString)}`;
        
        // 生成文件名
        finalFileName = fileName || this.generateFileName(data, 'svg');
      } else {
        // 生成 PNG 格式
        return new Promise<IQRCodeResult>((resolve, reject) => {
          QRCode.toDataURL(data, {
            errorCorrectionLevel: errorCorrectionLevel || 'M',
            width: width || 256,
            margin: margin ?? 4,
            color: {
              dark: color?.dark || '#000000',
              light: color?.light || '#FFFFFF'
            },
            type: 'image/png'
          }, async (error, url) => {
            if (error) {
              result.duration = Date.now() - startTime;
              result.error = error.message;
              reject(error);
              return;
            }

            try {
              // 将 dataURL 转换为 blob
              const response = await fetch(url);
              blob = await response.blob();
              
              dataURL = url;
              finalFileName = fileName || this.generateFileName(data, 'png');

              result.success = true;
              result.blob = blob;
              result.dataURL = dataURL;
              result.fileName = finalFileName;
              result.fileSize = blob.size;
              result.duration = Date.now() - startTime;
              result.errorCorrectionLevel = errorCorrectionLevel;
              result.size = width;

              resolve(result);
            } catch (fetchError) {
              result.duration = Date.now() - startTime;
              result.error = fetchError instanceof Error ? fetchError.message : 'Failed to convert dataURL to blob';
              reject(fetchError);
            }
          });
        });
      }

      // SVG 格式的结果设置
      result.success = true;
      result.blob = blob;
      result.dataURL = dataURL;
      result.fileName = finalFileName;
      result.fileSize = blob.size;
      result.duration = Date.now() - startTime;
      result.errorCorrectionLevel = errorCorrectionLevel;
      result.size = width;

      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * 批量生成QR码
   * @param dataAndOptions 数据和选项数组
   * @returns 生成结果数组
   */
  async generateBatchQRCodes(
    dataAndOptions: Array<{ data: string; options?: IQRCodeOptions; fileName?: string }>
  ): Promise<IQRCodeResult[]> {
    const results: IQRCodeResult[] = [];

    // 使用 Promise.allSettled 确保即使部分失败，其他继续执行
    const promises = dataAndOptions.map(({ data, options, fileName }) =>
      this.generateQRCode(data, options, fileName)
    );

    const settledResults = await Promise.allSettled(promises);

    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          originalData: dataAndOptions[index]?.data || 'Unknown',
          success: false,
          duration: 0,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        });
      }
    });

    return results;
  }

  /**
   * 生成文件名
   * @param data 数据内容
   * @param type 文件类型
   * @returns 文件名
   */
  private generateFileName(data: string, type: 'svg' | 'png'): string {
    // 清理文件名
    const cleanData = data
      .replace(/[^\w\s-]/gi, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const extension = type === 'svg' ? 'svg' : 'png';
    return `qrcode_${cleanData || 'unnamed'}_${timestamp}.${extension}`;
  }

  /**
   * 获取支持的错误纠正级别
   * @returns 错误纠正级别列表
   */
  static getSupportedErrorCorrectionLevels(): Array<{
    value: QRErrorCorrectionLevel;
    label: string;
    description: string;
  }> {
    return [
      {
        value: QRErrorCorrectionLevel.L,
        label: 'L (低)',
        description: '~7% 纠错，最高容量'
      },
      {
        value: QRErrorCorrectionLevel.M,
        label: 'M (中)',
        description: '~15% 纠错，良好平衡'
      },
      {
        value: QRErrorCorrectionLevel.Q,
        label: 'Q (四分之一)',
        description: '~25% 纠错，更好可靠性'
      },
      {
        value: QRErrorCorrectionLevel.H,
        label: 'H (高)',
        description: '~30% 纠错，最高可靠性'
      }
    ];
  }
}

/**
 * 便捷函数：生成QR码
 * @param data 要编码的数据
 * @param options QR码配置
 * @param fileName 文件名（可选）
 * @returns 生成结果
 */
export async function generateQRCode(
  data: string,
  options: IQRCodeOptions = {},
  fileName?: string
): Promise<IQRCodeResult> {
  const generator = new QRCodeGenerator();
  return generator.generateQRCode(data, options, fileName);
}

