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
}

/**
 * 统一的字段类型接口
 */
export interface IField {
  id: string;
  name: string;
  type: string;
  cellValueType: string;
  isLookup?: boolean;
  isComputed?: boolean;
  isMultipleCellValue?: boolean;
  isConditionalLookup?: boolean;
  isRollup?: boolean;
  isConditionalField?: boolean;
  lookupOptions?: IFieldLookupOptions;
  options?: any;
  description?: string;
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
  tableId?: string;
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