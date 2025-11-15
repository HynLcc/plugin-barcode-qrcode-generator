import { useQuery } from '@tanstack/react-query';
import * as openApi from '@teable/openapi';
import { useGlobalUrlParams } from './useGlobalUrlParams';
import type { IField } from '../types';

/**
 * Centralized hook for fetching and caching field data from Teable tables.
 * Provides a unified interface for field data retrieval with built-in caching
 * and error handling.
 *
 * Features:
 * - Automatic caching with 5-minute stale time
 * - 10-minute cache time for optimal performance
 * - Error handling with fallback to empty array
 * - Disabled state when no table ID is available
 *
 * @returns {UseQueryResult<IField[], Error>} React Query result with field data
 */
export function useFields() {
  const urlParams = useGlobalUrlParams();

  return useQuery({
    queryKey: ['fields', urlParams.tableId],
    queryFn: async () => {
      if (!urlParams.tableId) {
        return [];
      }
      try {
        const result = await openApi.getFields(urlParams.tableId);
        return (result.data || []) as IField[];
      } catch (error) {
        console.error('Failed to fetch fields:', error);
        return [];
      }
    },
    enabled: !!urlParams.tableId,
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  });
}

/**
 * Selective version of the useFields hook that allows for data transformation
 * and filtering to reduce memory usage and improve performance.
 *
 * Uses the same caching strategy as useFields but applies a selector function
 * to transform the data before returning it, useful for:
 * - Filtering fields by type
 * - Mapping fields to specific properties
 * - Computing derived values from field data
 *
 * @template T The type of the transformed data returned by the selector
 * @param {(fields: IField[]) => T} selector - Function to transform/field data
 * @returns {UseQueryResult<T, Error>} React Query result with transformed data
 */
export function useFieldsSelect<T>(selector: (fields: IField[]) => T) {
  const urlParams = useGlobalUrlParams();

  return useQuery({
    queryKey: ['fields', urlParams.tableId],
    queryFn: async () => {
      if (!urlParams.tableId) {
        return [];
      }
      try {
        const result = await openApi.getFields(urlParams.tableId);
        return (result.data || []) as IField[];
      } catch (error) {
        console.error('Failed to fetch fields:', error);
        return [];
      }
    },
    enabled: !!urlParams.tableId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    select: selector,
  });
}