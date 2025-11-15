'use client';
import { PluginPosition } from '@teable/openapi';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import type { IPageParams } from './types';

export const EvnContext = React.createContext<IPageParams>(null!);

export const EnvProvider = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const searchParams = useSearchParams();

  // Safely extract and validate language parameter
  const langParam = searchParams.get('lang');
  const lang: 'en' | 'zh' = (langParam === 'en' || langParam === 'zh') ? langParam : 'en';

  // Safely extract and validate theme parameter
  const themeParam = searchParams.get('theme');
  const theme: 'light' | 'dark' = (themeParam === 'light' || themeParam === 'dark') ? themeParam : 'light';

  // Extract optional parameters, only include them if they exist
  const shareIdParam = searchParams.get('shareId');
  const tableIdParam = searchParams.get('tableId');

  const contextValue: IPageParams = {
    lang,
    baseId: searchParams.get('baseId') || '',
    pluginId: searchParams.get('pluginId') || '',
    pluginInstallId: searchParams.get('pluginInstallId') || '',
    positionId: searchParams.get('positionId') || '',
    theme,
    positionType: (searchParams.get('positionType') as PluginPosition) || PluginPosition.Dashboard,
  };

  // Only add optional properties if they exist
  if (shareIdParam) {
    contextValue.shareId = shareIdParam;
  }
  if (tableIdParam) {
    contextValue.tableId = tableIdParam;
  }

  return (
    <EvnContext.Provider value={contextValue}>
      {children}
    </EvnContext.Provider>
  );
};
