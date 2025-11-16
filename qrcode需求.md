# QR 码功能实现文档

## 概述

本文档详细描述了 Teable 插件中 QR 码生成功能的完整实现架构、技术细节和使用方法。

## 技术栈

### 核心依赖
- **qrcode**: `^1.5.4` - QR 码生成库，支持 SVG 和 PNG 格式输出
- **@types/qrcode**: `^1.5.6` - TypeScript 类型定义

### 框架集成
- **React 18.2.0** - UI 组件框架
- **Next.js 14.2.14** - 全栈 React 框架
- **TypeScript 5** - 类型安全的 JavaScript

## 架构设计

### 1. 核心工具类 (`src/utils/qrCodeGenerator.ts`)

#### 主要类和接口

```typescript
// QR 码错误纠正级别
export enum QRErrorCorrectionLevel {
  L = 'L', // 低 - ~7% 纠错，最高容量
  M = 'M', // 中 - ~15% 纠错，良好平衡
  Q = 'Q', // 四分之一 - ~25% 纠错，更好可靠性
  H = 'H'  // 高 - ~30% 纠错，最高可靠性
}

// QR 码生成选项接口 (基于5项用户配置)
export interface IQRCodeOptions {
  errorCorrectionLevel?: QRErrorCorrectionLevel;  // 1. 错误纠正级别
  width?: number;                                  // 2. 尺寸设置 (使用width而非size)
  color?: {                                       // 3. 颜色配置
    dark?: string;    // 前景色
    light?: string;   // 背景色
  };
  margin?: number;                                 // 4. 边距设置
  type?: 'svg' | 'png';                           // 5. 输出格式
}

// QR 码生成结果接口
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
```

#### QRCodeGenerator 类

```typescript
export class QRCodeGenerator {
  constructor(defaultOptions: IQRCodeOptions = {});

  // 生成单个 QR 码
  async generateQRCode(
    data: string,
    options: IQRCodeOptions = {},
    fileName?: string
  ): Promise<IQRCodeResult>;

  // 批量生成 QR 码
  async generateBatchQRCodes(
    dataAndOptions: Array<{ data: string; options?: IQRCodeOptions; fileName?: string }>
  ): Promise<IQRCodeResult[]>;

  // 静态方法：获取支持的错误纠正级别
  static getSupportedErrorCorrectionLevels(): Array<{
    value: QRErrorCorrectionLevel; label: string; description: string;
  }>;

  
  // 静态方法：获取尺寸预设
  static getSupportedSizePresets(): Array<{
    value: QRSizePreset; label: string; size: number;
  }>;
}
```

### 2. 预览组件 (`src/components/QRCodePreview.tsx`)

#### 组件接口

```typescript
interface QRCodePreviewProps {
  value: string;                          // 要编码的数据
  size?: number;                          // QR 码尺寸（正方形）
  fgColor?: string;                       // 前景色
  bgColor?: string;                       // 背景色
  level?: QRErrorCorrectionLevel;         // 错误纠正级别
  includeMargin?: boolean;                // 是否包含边距
  className?: string;                     // 自定义 CSS 类名
}
```

#### 实现特点

1. **实时生成**: 使用 `useEffect` 监听属性变化，实时生成 QR 码
2. **SVG 渲染**: 通过 `dangerouslySetInnerHTML` 直接渲染 SVG 内容
3. **状态管理**: 包含加载、错误和完成状态的 UI 处理
4. **响应式设计**: 支持自定义尺寸和样式

```typescript
export const QRCodePreview: React.FC<QRCodePreviewProps> = ({
  value, size = 256, fgColor = '#000000', bgColor = '#FFFFFF',
  level = QRErrorCorrectionLevel.M, includeMargin = true, className
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
      } finally {
        setIsLoading(false);
      }
    };

    generateSVG();
  }, [value, size, fgColor, bgColor, level, includeMargin]);

  // 渲染逻辑...
};
```

### 3. 用户界面集成 (`src/components/SimpleLinkConverter.tsx`)

#### 配置状态管理

```typescript
// 基于5项用户配置的QR码配置状态
const [qrConfig, setQrConfig] = useState({
  errorCorrectionLevel: QRErrorCorrectionLevel.M,  // 1. 错误纠正级别
  width: 256,                                      // 2. 尺寸设置
  color: {                                         // 3. 颜色配置
    dark: '#000000',  // 前景色
    light: '#FFFFFF'  // 背景色
  },
  margin: 4,                                       // 4. 边距设置
  type: 'svg' as 'svg' | 'png'                    // 5. 输出格式
});
```

#### 主要功能模块 (基于5项用户配置)

1. **错误纠正级别配置**: 提供 L/M/Q/H 四个级别选择，满足不同可靠性需求
2. **尺寸设置**: 提供预设尺寸和自定义宽度控制，支持打印和显示需求
3. **颜色配置**: 前景色和背景色选择器，支持品牌色彩定制
4. **边距设置**: 可调节的安静区域，确保扫描可靠性
5. **输出格式选择**: SVG 矢量图和 PNG 位图格式选择
6. **数据源集成**: 选择视图、数据字段和附件字段
7. **实时预览**: 使用表格数据动态生成预览
8. **批量生成**: 高效处理多条记录的 QR 码生成和上传

## 数据处理

### 直接使用用户数据

QR码生成器直接使用用户提供的原始数据，不进行任何格式化或类型判断。这种方式确保：

1. **数据完整性**: 用户输入的任何内容都会被完整编码
2. **灵活性**: 支持任意文本、URL、数字或其他格式
3. **简单性**: 避免不必要的格式转换，保持数据的原始状态

```typescript
// 简化的数据处理 - 直接使用用户输入
const encodeText = text.trim(); // 仅去除首尾空白字符
```

## 图像生成流程

### SVG 格式生成

```typescript
if (type === 'svg') {
  const svgString = await QRCode.toString(data, {
    errorCorrectionLevel,
    width,
    margin,
    color,
    type: 'svg'
  });

  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const dataURL = `data:image/svg+xml;base64,${btoa(svgString)}`;

  return { blob, dataURL };
}
```

### PNG 格式生成

```typescript
return new Promise((resolve, reject) => {
  QRCode.toDataURL(data, {
    errorCorrectionLevel,
    width,
    margin,
    color,
    type: 'image/png'
  }, (error, url) => {
    if (error) {
      reject(error);
      return;
    }

    // 将 dataURL 转换为 blob
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        resolve({ blob, dataURL: url });
      })
      .catch(reject);
  });
});
```

## 文件命名策略

```typescript
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
```

## 批量处理特性

### 并发控制

```typescript
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
```

## 与 Teable 生态集成

### 插件桥接通信

```typescript
const bridge = usePluginBridge();

// 获取临时令牌用于 API 调用
const tokenResponse = await bridge.getSelfTempToken();
setAuthToken(tokenResponse.accessToken);

// 上传生成的 QR 码到附件字段
const formData = new FormData();
formData.append('file', qrResult.blob, qrResult.fileName);
formData.append('recordId', record.id);

const uploadResponse = await openApi.uploadAttachment(tableId, attachmentFieldId, formData);
```

### 数据查询和状态管理

```typescript
// 使用 React Query 获取表格数据
const { data: recordsData, isLoading: recordsLoading } = useQuery({
  queryKey: ['tableRecords', tableId, selectedView],
  queryFn: async () => {
    if (!tableId) return null;
    try {
      const viewId = selectedView || undefined;
      const { data } = await openApi.getRecords(tableId, { viewId });
      return data;
    } catch (error) {
      console.error('Failed to load records for preview:', error);
      return null;
    }
  },
  enabled: !!tableId,
  staleTime: 30000, // 30 秒缓存
});
```

## 国际化支持

### 翻译键结构

```json
{
  "qrcode": {
    "title": "QR码",
    "dataSource": "数据源",
    "basicSettings": "基本设置",
    "errorCorrection": "错误纠正级别",
    "sizeSettings": "尺寸设置",
    "logoSettings": "Logo设置",
    "marginSettings": "边距设置",
    "preview": "预览",
    "generationProgress": "生成进度",
    "generateQRCode": "生成QR码"
  }
}
```

## 性能优化

### 1. 缓存策略
- **React Query 缓存**: 10-30 秒的陈旧时间配置
- **内存优化**: 及时清理不需要的 SVG 内容

### 2. 实时预览优化
- **防抖处理**: 避免频繁重新生成
- **增量更新**: 只在配置变化时重新生成

### 3. 批量处理优化
- **Promise.allSettled**: 确保容错性
- **并发控制**: 避免浏览器资源耗尽

## 错误处理

### 1. 输入验证
```typescript
if (!data || typeof data !== 'string') {
  throw new Error('Data is required and must be a string');
}
```

### 2. 生成错误处理
```typescript
try {
  const svgString = await QRCode.toString(data, qrOptions);
  setSvgContent(svgString);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to generate QR code');
  console.error('QR Code generation error:', err);
}
```

### 3. 上传错误处理
```typescript
if (uploadResponse.data) {
  result.successCount = 1;
  successCount += 1;
  updateStats('success');
} else {
  result.failedUrls.push(encodeText);
  result.errors.push('Upload failed');
  updateStats('failed');
}
```

## 使用示例

### 基本使用

```typescript
import { QRCodePreview } from './QRCodePreview';
import { QRErrorCorrectionLevel } from '../utils/qrCodeGenerator';

function App() {
  return (
    <QRCodePreview
      value="https://teable.ai"
      size={256}
      fgColor="#000000"
      bgColor="#FFFFFF"
      level={QRErrorCorrectionLevel.M}
      includeMargin={true}
    />
  );
}
```

### 高级配置

```typescript
import { generateQRCode, QRErrorCorrectionLevel } from '../utils/qrCodeGenerator';

async function generateCustomQRCode() {
  const result = await generateQRCode(
    "Hello World",
    {
      errorCorrectionLevel: QRErrorCorrectionLevel.H,  // 1. 错误纠正级别
      width: 512,                                      // 2. 尺寸设置
      color: {                                         // 3. 颜色配置
        dark: '#2563eb',   // 前景色
        light: '#f3f4f6'   // 背景色
      },
      margin: 4,                                       // 4. 边距设置
      type: 'svg'                                      // 5. 输出格式
    },
    "custom_qrcode"
  );

  if (result.success && result.blob) {
    // 处理生成的 QR 码
    console.log(`Generated QR code: ${result.fileName}`);
  }
}
```


## 总结

本 QR 码实现提供了完整、可扩展的 QR 码生成解决方案，基于5项核心用户配置，集成了：

1. **5项核心配置**: 错误纠正级别、尺寸、颜色、边距、输出格式
2. **核心生成功能**: 基于成熟的 qrcode 库
3. **用户界面**: 直观的配置和预览界面
4. **批量处理**: 高效的批量生成和上传
5. **错误处理**: 完善的异常处理机制
6. **性能优化**: 缓存和并发控制
7. **国际化**: 完整的多语言支持

该实现为 Teable 用户提供了一个强大而易用的 QR 码生成工具，可以无缝集成到现有的工作流程中。

### 配置映射关系

| 用户配置 | qrcode 库选项 | 说明 |
|---------|---------------|------|
| 错误纠正级别 | `errorCorrectionLevel` | L/M/Q/H 四个级别 |
| 尺寸设置 | `width` | QR 码的像素宽度 |
| 颜色配置 | `color.dark/light` | 前景色和背景色 |
| 边距设置 | `margin` | 安静区域大小 |
| 输出格式 | `type` | SVG 或 PNG 格式 |