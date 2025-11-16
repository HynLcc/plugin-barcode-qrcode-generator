import { BarcodeFormat, OutputFormat } from '@/utils/barcodeGenerator';

export interface BarcodeConfig {
  format: BarcodeFormat;
  outputFormat: OutputFormat;
  width: number;
  height: number;
  displayValue?: boolean;
  fontSize: number;
  lineColor: string;
  background: string;
  margin: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;

  // 文本显示选项
  text: string;
  font: string;
  fontOptions: string;
  textAlign: 'left' | 'center' | 'right';
  textPosition: 'top' | 'bottom';
  textMargin: number;

  // 特定格式选项
  ean128: boolean | string;
  flat: boolean;
}

// 转换结果接口
export interface IConversionResult {
  recordId: string;
  urlCount: number;
  successCount: number;
  failedUrls: string[];
  errors: string[];
}

