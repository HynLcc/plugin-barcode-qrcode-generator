import type { PluginPosition } from '@teable/openapi';

export interface IPageParams {
  lang: 'en' | 'zh';
  baseId: string;
  pluginInstallId: string;
  positionId: string;
  positionType: PluginPosition;
  pluginId: string;
  theme: 'light' | 'dark';
  tableId?: string;
  shareId?: string;
}
