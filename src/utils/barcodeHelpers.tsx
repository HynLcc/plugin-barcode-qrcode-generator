import { BarcodeFormat } from '@/utils/barcodeGenerator';

// 必填标记组件
export const RequireCom = () => <span className="mr-0.5 text-red-500">*</span>;

// 根据条形码格式获取示例文本
export const getPreviewTextByFormat = (format: BarcodeFormat): string => {
  switch (format) {
    case BarcodeFormat.CODE128:
      return 'Hello123';
    case BarcodeFormat.CODE128A:
      return 'ABC123';
    case BarcodeFormat.CODE128B:
      return 'Hello';
    case BarcodeFormat.CODE128C:
      return '123456';
    case BarcodeFormat.CODE39:
      return 'ABC123';
    case BarcodeFormat.EAN13:
      return '5901234123457';
    case BarcodeFormat.EAN8:
      return '96385074';
    case BarcodeFormat.EAN5:
      return '12345';
    case BarcodeFormat.EAN2:
      return '53';
    case BarcodeFormat.UPC:
      return '123456789999';
    case BarcodeFormat.UPCE:
      return '01245714';
    case BarcodeFormat.ITF:
      return '123456';
    case BarcodeFormat.ITF14:
      return '98765432109213';
    case BarcodeFormat.MSI:
      return '12345674';
    case BarcodeFormat.MSI10:
      return '1234567';
    case BarcodeFormat.MSI11:
      return '123456';
    case BarcodeFormat.MSI1010:
      return '1234567';
    case BarcodeFormat.MSI1110:
      return '12345678';
    case BarcodeFormat.pharmacode:
      return '1234';
    case BarcodeFormat.codabar:
      return 'A1234567890A';
    default:
      return '1234567890';
  }
};

