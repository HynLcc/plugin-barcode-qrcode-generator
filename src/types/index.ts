// 核心业务类型定义

/**
 * 记录数据接口
 */
export interface IRecordData {
  id: string;
  fields: Record<string, string | number | boolean | null | undefined>;
}

/**
 * 字段查找选项接口
 */
export interface IFieldLookupOptions {
  filter?: any;
  // 可以根据需要添加更多查找选项属性
}

/**
 * 扩展的字段类型接口，兼容Teable SDK
 */
export interface IField {
  id: string;
  name: string;
  type: string;
  cellValueType: string;
  isLookup?: boolean;
  isConditionalLookup?: boolean;
  isComputed?: boolean;
  isMultipleCellValue?: boolean;
  lookupOptions?: IFieldLookupOptions;
  // 其他可能的Teable字段属性
  options?: any;
  description?: string;
  // 向后兼容的属性
  isRollup?: boolean;
  isFormula?: boolean;
}

/**
 * UI字段信息接口，用于组件内部字段展示
 */
export interface IUIField {
  id: string;
  name: string;
  type: string;
  cellValueType: string;
  isComputed: boolean;
  isLookup: boolean;
  isConditionalLookup: boolean;
  isRollup: boolean;
  isMultipleCellValue: boolean;
  isConditionalField: boolean;
  lookupOptions?: IFieldLookupOptions;
  // 其他可选属性
  options?: any;
  description?: string;
}

/**
 * 字段选项接口
 */
export interface IFieldOption {
  id: string;
  name: string;
  type: string;
}

/**
 * 排序方向类型
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 错误类型
 */
export interface IAppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}


/**
 * Toast 通知类型
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * 组件 Props 类型
 */
export interface IBaseComponentProps {
  disabled?: boolean;
  className?: string;
}

/**
 * 选择器组件 Props 类型
 */
export interface ISelectorProps<T = string> extends IBaseComponentProps {
  value?: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  options: Array<{
    value: T;
    label: string;
    disabled?: boolean;
  }>;
}

/**
 * URL 参数类型
 */
export interface IUrlParams {
  lang: 'en' | 'zh';
  baseId: string;
  pluginInstallId: string;
  positionId: string;
  positionType: string;
  pluginId: string;
  theme: 'light' | 'dark';
  tableId?: string; // 在实际使用中 tableId 是必需的
  viewId?: string;
  dashboardId?: string;
  recordId?: string;
  shareId?: string;
}

/**
 * API 响应基础类型
 */
export interface IApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * 分页参数类型
 */
export interface IPaginationParams {
  take?: number;
  skip?: number;
}

/**
 * 排序参数类型
 */
export interface ISortParams {
  fieldId: string;
  order: 'asc' | 'desc';
}

/**
 * 记录查询参数类型
 */
export interface IRecordQueryParams extends IPaginationParams {
  viewId?: string;
  orderBy?: ISortParams[];
  projection?: string[];
  fieldKeyType?: 'id' | 'name';
}

/**
 * 视图类型定义
 */
export interface IView {
  id: string;
  name: string;
  type: 'grid' | 'gallery' | 'kanban' | 'calendar' | 'form' | 'component';
  description?: string;
  order: number;
  shared?: boolean;
  icon?: string;
}