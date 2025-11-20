import { generateQRCode, IQRCodeResult } from '@/utils/qrCodeGenerator';
import { IQRCodeOptions } from '@/utils/qrCodeGenerator';
import { useBaseCodeConversion, CodeGeneratorFunction } from './useBaseCodeConversion';

/**
 * 适配QR码生成器的结果转换
 */
function adaptQRCodeResult(qrResult: IQRCodeResult) {
  return {
    success: qrResult.success,
    dataURL: qrResult.dataURL,
    blob: qrResult.blob,
    fileName: qrResult.fileName,
    error: qrResult.error,
  };
}

/**
 * QR码生成函数适配器
 */
const generateQRCodeAdapter: CodeGeneratorFunction<IQRCodeOptions> = async (
  text: string,
  config: IQRCodeOptions,
  fileName: string
) => {
  const result = await generateQRCode(text, config, fileName);
  return adaptQRCodeResult(result);
};

export function useQRCodeConversion(
  tableId: string | undefined,
  selectedViewId: string,
  selectedUrlField: string,
  selectedAttachmentField: string,
  qrConfig: IQRCodeOptions,
  isConfigValid: boolean
) {
  const baseResult = useBaseCodeConversion(
    tableId,
    selectedViewId,
    selectedUrlField,
    selectedAttachmentField,
    qrConfig,
    isConfigValid,
    generateQRCodeAdapter
  );

  return {
    ...baseResult,
    handleQRCodeConvert: baseResult.handleConvert,
  };
}