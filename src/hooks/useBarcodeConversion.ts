import { useCallback } from 'react';
import { generateBarcode, IBarcodeResult } from '@/utils/barcodeGenerator';
import { BarcodeConfig } from '@/types/barcodeGenerator';
import { useBaseCodeConversion, CodeGeneratorFunction } from './useBaseCodeConversion';

/**
 * 适配条形码生成器的结果转换
 */
function adaptBarcodeResult(barcodeResult: IBarcodeResult) {
  return {
    success: barcodeResult.success,
    dataURL: barcodeResult.dataURL,
    blob: barcodeResult.blob,
    fileName: barcodeResult.fileName,
    error: barcodeResult.error,
  };
}

/**
 * 条形码生成函数适配器
 */
const generateBarcodeAdapter: CodeGeneratorFunction<BarcodeConfig> = async (
  text: string,
  config: BarcodeConfig,
  fileName: string
) => {
  const result = await generateBarcode(text, config, fileName);
  return adaptBarcodeResult(result);
};

export function useBarcodeConversion(
  tableId: string | undefined,
  selectedViewId: string,
  selectedUrlField: string,
  selectedAttachmentField: string,
  barcodeConfig: BarcodeConfig,
  isConfigValid: boolean
) {
  const baseResult = useBaseCodeConversion(
    tableId,
    selectedViewId,
    selectedUrlField,
    selectedAttachmentField,
    barcodeConfig,
    isConfigValid,
    generateBarcodeAdapter
  );

  return {
    ...baseResult,
    handleBarcodeConvert: baseResult.handleConvert,
  };
}