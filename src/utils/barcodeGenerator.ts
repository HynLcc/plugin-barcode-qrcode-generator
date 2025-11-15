/**
 * 条码生成工具
 * 使用 JsBarcode 将文本内容转换为条码图片
 */

import JsBarcode from 'jsbarcode';

/**
 * 支持的条码格式
 */
export enum BarcodeFormat {
  // CODE128 系列 - 4种变体
  CODE128 = 'CODE128',
  CODE128A = 'CODE128A',
  CODE128B = 'CODE128B',
  CODE128C = 'CODE128C',

  // EAN/UPC 系列 - 6种类型
  EAN13 = 'EAN13',
  EAN8 = 'EAN8',
  EAN5 = 'EAN5',
  EAN2 = 'EAN2',
  UPC = 'UPC',
  UPCE = 'UPCE',

  // CODE39 - 1种
  CODE39 = 'CODE39',

  // ITF 系列 - 2种
  ITF = 'ITF',
  ITF14 = 'ITF14',

  // MSI 系列 - 5种不同的校验和算法
  MSI = 'MSI',
  MSI10 = 'MSI10',
  MSI11 = 'MSI11',
  MSI1010 = 'MSI1010',
  MSI1110 = 'MSI1110',

  // Pharmacode - 1种
  pharmacode = 'pharmacode',

  // Codabar - 1种
  codabar = 'codabar'
}

/**
 * 输出格式
 */
export enum OutputFormat {
  PNG = 'png',
  SVG = 'svg'
}

/**
 * 条码配置选项
 */
export interface IBarcodeOptions {
  /** 条码格式 */
  format?: BarcodeFormat;
  /** 输出格式 */
  outputFormat?: OutputFormat;
  /** 条码宽度 */
  width?: number;
  /** 条码高度 */
  height?: number;
  /** 显示文本 */
  displayValue?: boolean;
  /** 文本字体大小 */
  fontSize?: number;
  /** 文本位置 */
  textPosition?: 'top' | 'bottom';
  /** 文本对齐 */
  textAlign?: 'left' | 'center' | 'right';
  /** 文本边距 */
  textMargin?: number;
  /** 前景色 */
  lineColor?: string;
  /** 背景色 */
  background?: string;
  /** 边距 */
  margin?: number;
  /** 左边距 */
  marginTop?: number;
  /** 右边距 */
  marginBottom?: number;
  /** 左边距 */
  marginLeft?: number;
  /** 右边距 */
  marginRight?: number;
  /** 是否有效验码 */
  valid?: (valid: boolean) => void;
}

/**
 * 条码生成结果
 */
export interface IBarcodeResult {
  /** 原始文本内容 */
  originalText: string;
  /** 是否生成成功 */
  success: boolean;
  /** Blob数据 */
  blob?: Blob;
  /** DataURL */
  dataURL?: string;
  /** 文件名 */
  fileName?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 生成耗时 (毫秒) */
  duration: number;
  /** 错误信息 */
  error?: string;
  /** 条码格式 */
  format?: BarcodeFormat;
}

/**
 * 默认条码配置
 */
const DEFAULT_BARCODE_OPTIONS: Required<IBarcodeOptions> = {
  format: BarcodeFormat.CODE128,
  outputFormat: OutputFormat.PNG,
  width: 2,
  height: 100,
  displayValue: true,
  fontSize: 20,
  textPosition: 'bottom',
  textAlign: 'center',
  textMargin: 2,
  lineColor: '#000000',
  background: '#FFFFFF',
  margin: 10,
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  valid: () => {}
};

/**
 * 条码生成器类
 */
export class BarcodeGenerator {
  private defaultOptions: IBarcodeOptions;

  constructor(defaultOptions: IBarcodeOptions = {}) {
    this.defaultOptions = { ...DEFAULT_BARCODE_OPTIONS, ...defaultOptions };
  }

  /**
   * 生成条码
   * @param text 文本内容
   * @param options 条码配置
   * @param fileName 文件名（可选）
   * @returns 生成结果
   */
  async generateBarcode(
    text: string,
    options: IBarcodeOptions = {},
    fileName?: string
  ): Promise<IBarcodeResult> {
    const startTime = Date.now();
    const result: IBarcodeResult = {
      originalText: text,
      success: false,
      duration: 0,
      format: options.format || this.defaultOptions.format || BarcodeFormat.CODE128
    };

    try {
      // 验证输入
      if (!text || typeof text !== 'string') {
        throw new Error('Text content is required and must be a string');
      }

      // 合并配置
      const mergedOptions = { ...this.defaultOptions, ...options };

      // 添加校验回调，使用JsBarcode内置的验证
      const optionsWithValidation = {
        ...mergedOptions,
        valid: (valid: boolean) => {
          if (!valid) {
            throw new Error(`Invalid data for ${mergedOptions.format} format: "${text}"`);
          }
        }
      };

      
      const outputFormat = mergedOptions.outputFormat || OutputFormat.PNG;
      let blob: Blob;
      let dataURL: string;
      let finalFileName: string;

      if (outputFormat === OutputFormat.SVG) {
        // 生成 SVG 条码
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        try {
          // 生成 SVG 条码（使用带验证的选项）
          JsBarcode(svgElement, text, optionsWithValidation);

          // 转换为 SVG 字符串
          const svgString = new XMLSerializer().serializeToString(svgElement);

          // 创建 Blob
          blob = new Blob([svgString], { type: 'image/svg+xml' });

          // 生成 DataURL
          dataURL = `data:image/svg+xml;base64,${btoa(svgString)}`;

          // 生成文件名
          finalFileName = fileName || this.generateFileName(text, mergedOptions.format, 'svg');

        } finally {
          // 清理 SVG 元素
          svgElement.remove();
        }
      } else {
        // 生成 PNG 条码（使用 canvas）
        const canvas = document.createElement('canvas');
        canvas.id = `barcode-canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
          // 生成条码（使用带验证的选项）
          JsBarcode(canvas, text, optionsWithValidation);

          // 转换为Blob
          blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                console.error('Canvas toBlob returned null');
                reject(new Error('Failed to generate blob from canvas'));
              }
            }, 'image/png', 0.95);
          });

          // 生成DataURL
          dataURL = canvas.toDataURL('image/png', 0.95);

          // 生成文件名
          finalFileName = fileName || this.generateFileName(text, mergedOptions.format, 'png');

        } finally {
          // 清理canvas元素
          canvas.remove();
        }
      }

      // 填充成功结果
      result.success = true;
      result.blob = blob;
      result.dataURL = dataURL;
      result.fileName = finalFileName;
      result.fileSize = blob.size;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown barcode generation error';
      console.error(`Failed to generate barcode for "${text}":`, error);
      console.error(`Barcode config:`, mergedOptions);
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 批量生成条码
   * @param textAndOptions 文本和配置数组
   * @returns 生成结果数组
   */
  async generateBatchBarcodes(
    textAndOptions: Array<{ text: string; options?: IBarcodeOptions; fileName?: string }>
  ): Promise<IBarcodeResult[]> {
    const results: IBarcodeResult[] = [];

    // 使用Promise.allSettled来确保即使某些失败，其他的也能继续
    const promises = textAndOptions.map(({ text, options, fileName }) =>
      this.generateBarcode(text, options, fileName)
    );

    const settledResults = await Promise.allSettled(promises);

    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          originalText: textAndOptions[index]?.text || 'Unknown',
          success: false,
          duration: 0,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        });
      }
    });

    return results;
  }

  /**
   * 验证条码内容和格式
   * @param text 文本内容
   * @param format 条码格式
   */
  private validateBarcodeContent(text: string, format?: BarcodeFormat): void {
    const selectedFormat = format || this.defaultOptions.format;

    switch (selectedFormat) {
      // EAN/UPC 系列
      case BarcodeFormat.EAN13:
        if (!/^\d{12,13}$/.test(text)) {
          throw new Error('EAN13 requires 12 or 13 digits');
        }
        break;

      case BarcodeFormat.EAN8:
        if (!/^\d{7,8}$/.test(text)) {
          throw new Error('EAN8 requires 7 or 8 digits');
        }
        break;

      case BarcodeFormat.EAN5:
        if (!/^\d{5}$/.test(text)) {
          throw new Error('EAN5 requires exactly 5 digits');
        }
        break;

      case BarcodeFormat.EAN2:
        if (!/^\d{2}$/.test(text)) {
          throw new Error('EAN2 requires exactly 2 digits');
        }
        break;

      case BarcodeFormat.UPC:
        if (!/^\d{11,12}$/.test(text)) {
          throw new Error('UPC requires 11 or 12 digits');
        }
        break;

      case BarcodeFormat.UPCE:
        if (!/^\d{6,8}$/.test(text)) {
          throw new Error('UPCE requires 6 to 8 digits');
        }
        break;

      // CODE128 系列
      case BarcodeFormat.CODE128:
        // CODE128 支持ASCII 0-127的所有字符
        if (text.length === 0) {
          throw new Error('CODE128 requires at least one character');
        }
        break;

      case BarcodeFormat.CODE128A:
        // CODE128A 支持控制字符 (00-95) 和特殊字符
        if (text.length === 0) {
          throw new Error('CODE128A requires at least one character');
        }
        break;

      case BarcodeFormat.CODE128B:
        // CODE128B 支持ASCII字符 (32-127)
        if (text.length === 0) {
          throw new Error('CODE128B requires at least one character');
        }
        break;

      case BarcodeFormat.CODE128C:
        // CODE128C 专门用于数字对，需要偶数位长度
        if (!/^\d+$/.test(text) || text.length === 0) {
          throw new Error('CODE128C requires digits, preferably in pairs');
        }
        break;

      // CODE39
      case BarcodeFormat.CODE39:
        // CODE39 支持字母数字、空格和一些特殊字符
        if (!/^[0-9A-Z\-\.\$\/\+\%\s]*$/i.test(text)) {
          throw new Error('CODE39 supports uppercase letters, numbers, and symbols: -.$/+%');
        }
        break;

      // ITF 系列
      case BarcodeFormat.ITF:
        if (!/^\d+$/.test(text) || text.length < 2) {
          throw new Error('ITF requires at least 2 digits and must be even length');
        }
        if (text.length % 2 !== 0) {
          throw new Error('ITF requires an even number of digits');
        }
        break;

      case BarcodeFormat.ITF14:
        if (!/^\d{13,14}$/.test(text)) {
          throw new Error('ITF14 requires 13 or 14 digits');
        }
        // JsBarcode 会自动处理校验位计算，不需要手动验证偶数位
        break;

      // MSI 系列
      case BarcodeFormat.MSI:
      case BarcodeFormat.MSI10:
      case BarcodeFormat.MSI11:
      case BarcodeFormat.MSI1010:
      case BarcodeFormat.MSI1110:
        if (!/^\d+$/.test(text)) {
          throw new Error('MSI formats require only digits');
        }
        break;

      // Pharmacode
      case BarcodeFormat.pharmacode:
        if (!/^\d+$/.test(text) || parseInt(text) < 3 || parseInt(text) > 131070) {
          throw new Error('Pharmacode requires a number between 3 and 131070');
        }
        break;

      // Codabar
      case BarcodeFormat.codabar:
        // Codabar 支持数字和 -$:/.+ ABCD 四个字符作为开始/结束符
        if (!/^[0-9\-\$\:\/\.\+ABCD]+$/i.test(text)) {
          throw new Error('Codabar supports digits, -$:/.+ and ABCD start/stop characters');
        }
        break;

      default:
        throw new Error(`Unsupported barcode format: ${selectedFormat}`);
    }
  }

  
  /**
   * 生成文件名
   * @param text 文本内容
   * @param format 条码格式
   * @param extension 文件扩展名
   * @returns 文件名
   */
  private generateFileName(text: string, format?: BarcodeFormat, extension: string = 'png'): string {
    const selectedFormat = format || this.defaultOptions.format;

    // 清理文件名中的非法字符
    const cleanText = text
      .replace(/[^\w\s-]/gi, '')
      .replace(/\s+/g, '_')
      .substring(0, 20); // 限制长度

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `barcode_${selectedFormat}_${cleanText || 'unnamed'}_${timestamp}.${extension}`;
  }

  /**
   * 获取支持的条码格式列表
   * @returns 格式列表
   */
  static getSupportedFormats(): Array<{ value: BarcodeFormat; label: string; description: string }> {
    return [
      // CODE128 系列
      {
        value: BarcodeFormat.CODE128,
        label: 'CODE128',
        description: '支持所有ASCII字符，自动切换模式'
      },
      {
        value: BarcodeFormat.CODE128A,
        label: 'CODE128A',
        description: '控制字符和特殊符号 (00-95)'
      },
      {
        value: BarcodeFormat.CODE128B,
        label: 'CODE128B',
        description: '标准ASCII字符 (32-127)'
      },
      {
        value: BarcodeFormat.CODE128C,
        label: 'CODE128C',
        description: '数字优化，适合偶数位数字'
      },

      // EAN/UPC 系列
      {
        value: BarcodeFormat.EAN13,
        label: 'EAN-13',
        description: '13位数字，国际商品条码标准'
      },
      {
        value: BarcodeFormat.EAN8,
        label: 'EAN-8',
        description: '8位数字，压缩版商品条码'
      },
      {
        value: BarcodeFormat.EAN5,
        label: 'EAN-5',
        description: '5位数字，用于商品价格/重量'
      },
      {
        value: BarcodeFormat.EAN2,
        label: 'EAN-2',
        description: '2位数字，用于期刊版本号'
      },
      {
        value: BarcodeFormat.UPC,
        label: 'UPC-A',
        description: '12位数字，北美商品条码标准'
      },
      {
        value: BarcodeFormat.UPCE,
        label: 'UPC-E',
        description: '6-8位数字，压缩版UPC条码'
      },

      // 其他常用格式
      {
        value: BarcodeFormat.CODE39,
        label: 'CODE39',
        description: '支持字母数字和符号：-.$/+%'
      },
      {
        value: BarcodeFormat.ITF,
        label: 'ITF',
        description: '交错2of5，需要偶数位数字'
      },
      {
        value: BarcodeFormat.ITF14,
        label: 'ITF-14',
        description: '14位数字，物流和运输包装'
      },

      // MSI 系列
      {
        value: BarcodeFormat.MSI,
        label: 'MSI',
        description: 'Modified Plessey，纯数字'
      },
      {
        value: BarcodeFormat.MSI10,
        label: 'MSI10',
        description: 'MSI + Luhn校验'
      },
      {
        value: BarcodeFormat.MSI11,
        label: 'MSI11',
        description: 'MSI + Mod11校验'
      },
      {
        value: BarcodeFormat.MSI1010,
        label: 'MSI1010',
        description: 'MSI + 双重Mod10校验'
      },
      {
        value: BarcodeFormat.MSI1110,
        label: 'MSI1110',
        description: 'MSI + Mod11+Mod10校验'
      },

      // 专业格式
      {
        value: BarcodeFormat.pharmacode,
        label: 'Pharmacode',
        description: '制药行业，数字范围3-131070'
      },
      {
        value: BarcodeFormat.codabar,
        label: 'Codabar',
        description: '支持数字和-$:/.+，用于图书馆、血库'
      }
    ];
  }

  /**
   * 创建默认的条码生成器实例
   * @returns 条码生成器实例
   */
  static createDefault(): BarcodeGenerator {
    return new BarcodeGenerator();
  }
}

/**
 * 便捷函数：生成单个条码
 * @param text 文本内容
 * @param options 条码配置
 * @param fileName 文件名
 * @returns 生成结果
 */
export async function generateBarcode(
  text: string,
  options?: IBarcodeOptions,
  fileName?: string
): Promise<IBarcodeResult> {
  const generator = BarcodeGenerator.createDefault();
  return generator.generateBarcode(text, options, fileName);
}

/**
 * 便捷函数：批量生成条码
 * @param textAndOptions 文本和配置数组
 * @returns 生成结果数组
 */
export async function generateBatchBarcodes(
  textAndOptions: Array<{ text: string; options?: IBarcodeOptions; fileName?: string }>
): Promise<IBarcodeResult[]> {
  const generator = BarcodeGenerator.createDefault();
  return generator.generateBatchBarcodes(textAndOptions);
}