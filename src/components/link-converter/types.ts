/**
 * 链接转换器的类型定义
 */

// 危险文件扩展名列表
export const DANGEROUS_FILE_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
  'app', 'deb', 'pkg', 'dmg', 'rpm', 'msi', 'apk', 'ipa',
  'ps1', 'sh', 'bash', 'zsh', 'fish', 'py', 'pl', 'rb',
  'ms', 'mde', 'docm', 'dotm', 'xlsm', 'xltm', 'xlam', 'pptm', 'potm',
  'cpl', 'msp', 'scr', 'wsf', 'vbscript'
];

// 文件类型分类
export const FILE_TYPE_CATEGORIES = ['image', 'document', 'media', 'archive', 'other'] as const;

export type FileTypeCategory = typeof FILE_TYPE_CATEGORIES[number];

// 文件类型扩展名映射
export const FILE_TYPE_EXTENSIONS: Record<FileTypeCategory, string[]> = {
  image: [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif'
  ],
  document: [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp',
    'csv', 'json', 'xml', 'html', 'htm', 'md', 'tex'
  ],
  media: [
    'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'mp3', 'wav', 'ogg', 'flac',
    'aac', 'm4a', 'wma', 'mid', 'midi'
  ],
  archive: [
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'lzma', 'cab', 'iso', 'dmg'
  ],
  other: [] // 兜底类型
};

// 转换阶段
export type ConversionStage =
  | 'scanning'
  | 'downloading'
  | 'uploading'
  | 'completed'
  | 'error';

// URL检测结果
export interface IUrlDetectionResult {
  /** 字段ID */
  fieldId: string;
  /** 字段名称 */
  fieldName: string;
  /** 检测到的URL数量 */
  urlCount: number;
  /** 示例URL列表 */
  sampleUrls: string[];
}

// 转换器配置
export interface IConverterConfig {
  /** 视图ID */
  viewId?: string;
  /** URL字段ID列表 */
  urlFieldIds: string[];
  /** 附件字段ID */
  attachmentFieldId: string;
  /** 最大文件大小 (MB) */
  maxFileSize: number;
  /** 并发限制 */
  concurrencyLimit: number;
  /** 允许的文件类型 */
  allowedFileTypes: FileTypeCategory[];
  /** 是否允许所有文件类型 */
  allowAllFileTypes: boolean;
  /** 是否保留原始链接 */
  preserveOriginalLink: boolean;
}

// 转换进度
export interface IConversionProgress {
  /** 当前阶段 */
  stage: ConversionStage;
  /** 总URL数 */
  totalUrls: number;
  /** 已处理的URL数 */
  processedUrls: number;
  /** 成功转换数 */
  successfulConversions: number;
  /** 失败转换数 */
  failedConversions: number;
  /** 当前处理的文件名 */
  currentFile?: string;
  /** 下载进度 */
  downloadProgress?: number;
}

// 转换结果
export interface IConversionResult {
  /** 原始URL */
  url: string;
  /** 记录ID */
  recordId: string;
  /** 字段ID */
  fieldId: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  errorMessage?: string;
  /** 附件ID */
  attachmentId?: string;
  /** 文件名 */
  fileName?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 处理时间 (毫秒) */
  processingTime: number;
}