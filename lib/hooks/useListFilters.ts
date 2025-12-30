import { useCallback, useMemo, useState } from 'react';

/**
 * Type definition for sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Generic filter and sort configuration hook for list views
 * 
 * @template T - The type of items being filtered/sorted
 * @template F - The type of filter field
 * @template S - The type of sort field
 * 
 * @param items - Array of items to filter and sort
 * @param initialSortField - Initial field to sort by
 * @param initialSortDirection - Initial sort direction ('asc' or 'desc')
 * @param sortComparator - Function to compare two items for sorting
 * @param filterPredicate - Function to determine if an item matches current filters
 * 
 * @returns Object containing filtered/sorted items and control functions
 * 
 * @example
 * ```tsx
 * const { 
 *   sortedAndFiltered, 
 *   sortField, 
 *   sortDirection,
 *   filters,
 *   setSortField, 
 *   setSortDirection,
 *   setFilter
 * } = useListFilters({
 *   items: entities,
 *   initialSortField: 'name',
 *   initialSortDirection: 'asc',
 *   sortComparator: (a, b, field, direction) => {
 *     const comparison = a[field].localeCompare(b[field]);
 *     return direction === 'asc' ? comparison : -comparison;
 *   },
 *   filterPredicate: (item, filters) => {
 *     if (filters.type && filters.type !== 'ALL') {
 *       return item.type === filters.type;
 *     }
 *     return true;
 *   }
 * });
 * ```
 */
export function useListFilters<T, F extends string = string, S extends keyof T = keyof T>(options: {
  items: T[];
  initialSortField: S;
  initialSortDirection?: SortDirection;
  sortComparator: (a: T, b: T, field: S, direction: SortDirection) => number;
  filterPredicate: (item: T, filters: Record<string, any>) => boolean;
}) {
  const {
    items,
    initialSortField,
    initialSortDirection = 'asc',
    sortComparator,
    filterPredicate,
  } = options;

  const [sortField, setSortField] = useState<S>(initialSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [filters, setFilters] = useState<Record<string, any>>({});

  /**
   * Update a single filter value
   */
  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Reset all filters to empty state
   */
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Memoized filtered and sorted results
   */
  const sortedAndFiltered = useMemo(() => {
    // Apply filters
    let filtered = items.filter((item) => filterPredicate(item, filters));

    // Apply sorting
    filtered.sort((a, b) => sortComparator(a, b, sortField, sortDirection));

    return filtered;
  }, [items, filters, sortField, sortDirection, sortComparator, filterPredicate]);

  return {
    sortedAndFiltered,
    sortField,
    sortDirection,
    filters,
    setSortField,
    setSortDirection,
    setFilter,
    resetFilters,
    count: sortedAndFiltered.length,
  };
}

/**
 * Hook for managing card action handlers (edit, delete)
 * 
 * @param options - Configuration object
 * @param options.onEdit - Callback when edit is triggered
 * @param options.onDelete - Callback when delete is confirmed
 * @param options.getItemName - Function to extract item name for confirmation dialog
 * 
 * @returns Object with handleEdit and handleDelete functions
 * 
 * @example
 * ```tsx
 * const { handleEdit, handleDelete } = useCardActions({
 *   onEdit: (item) => router.push(`/entities/${item.id}`),
 *   onDelete: async (id) => {
 *     await deleteEntity({ id });
 *     refreshList();
 *   },
 *   getItemName: (item) => item.name
 * });
 * 
 * // In component:
 * <IconButton onClick={(e) => {
 *   e.stopPropagation();
 *   handleEdit(entity);
 * }}>
 *   <Edit />
 * </IconButton>
 * ```
 */
export function useCardActions<T extends { id: string }>(options: {
  onEdit: (item: T) => void;
  onDelete: (id: string) => Promise<void> | void;
  getItemName?: (item: T) => string;
}) {
  const { onEdit, onDelete, getItemName } = options;

  /**
   * Handle edit action
   */
  const handleEdit = useCallback(
    (item: T) => {
      onEdit(item);
    },
    [onEdit]
  );

  /**
   * Handle delete action with confirmation
   */
  const handleDelete = useCallback(
    async (item: T) => {
      const itemName = getItemName ? getItemName(item) : 'this item';
      const confirmed = confirm(`Delete "${itemName}"? This action cannot be undone.`);
      
      if (confirmed) {
        await onDelete(item.id);
      }
    },
    [onDelete, getItemName]
  );

  return {
    handleEdit,
    handleDelete,
  };
}
