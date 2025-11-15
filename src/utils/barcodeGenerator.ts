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
  /** 上边距 */
  marginTop?: number;
  /** 下边距 */
  marginBottom?: number;
  /** 左边距 */
  marginLeft?: number;
  /** 右边距 */
  marginRight?: number;

  // 新增的JsBarcode选项
  /** 覆盖显示的文本 */
  text?: string;
  /** 字体系列 (默认 "monospace") */
  font?: string;
  /** 字体样式选项 ("bold", "italic", "bold italic") */
  fontOptions?: string;

  // 特定格式选项
  /** CODE128系列: GS1-128/EAN-128编码 */
  ean128?: boolean | string;
  /** EAN/UPC系列: 扁平化编码 */
  flat?: boolean;

  /** 验证回调函数 */
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

  // 新增选项的默认值
  text: '', // 不覆盖文本，使用原始数据
  font: 'monospace', // JsBarcode默认字体
  fontOptions: '', // 无特殊字体样式
  ean128: false, // 默认不启用GS1-128编码
  flat: false, // 默认不扁平化编码

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

      // 过滤格式特定选项，只保留适用的选项
      const filteredOptions = this.filterFormatSpecificOptions(mergedOptions);

      // 添加校验回调，使用JsBarcode内置的验证
      const optionsWithValidation = {
        ...filteredOptions,
        valid: (valid: boolean) => {
          if (!valid) {
            throw new Error(`Invalid data for ${options.format} format: "${text}"`);
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
      console.error(`Barcode config:`, options);
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
   * 过滤格式特定选项，只保留当前格式适用的选项
   * @param options 完整的选项配置
   * @returns 过滤后的选项配置
   */
  private filterFormatSpecificOptions(options: IBarcodeOptions): IBarcodeOptions {
    const { format, ean128, flat, ...commonOptions } = options;

    // 创建基础选项（排除格式特定选项）
    const filtered: IBarcodeOptions = { ...commonOptions };

    // 根据格式类型添加特定选项
    switch (format) {
      case BarcodeFormat.CODE128:
      case BarcodeFormat.CODE128A:
      case BarcodeFormat.CODE128B:
      case BarcodeFormat.CODE128C:
        // CODE128系列支持ean128选项
        if (ean128 !== false && ean128 !== undefined) {
          filtered.ean128 = ean128;
        }
        break;

      case BarcodeFormat.EAN13:
      case BarcodeFormat.EAN8:
      case BarcodeFormat.EAN5:
      case BarcodeFormat.EAN2:
      case BarcodeFormat.UPC:
      case BarcodeFormat.UPCE:
        // EAN/UPC系列支持flat选项
        if (flat !== false && flat !== undefined) {
          filtered.flat = flat;
        }
        break;

      default:
        // 其他格式忽略ean128和flat选项
        break;
    }

    return filtered;
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