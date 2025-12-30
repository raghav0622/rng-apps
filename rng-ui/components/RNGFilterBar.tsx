'use client';

import { FilterList, Sort, SwapVert } from '@mui/icons-material';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';

/**
 * Filter/Sort Option
 */
export interface FilterOption {
  /** Display label */
  label: string;
  /** Option value */
  value: string;
}

/**
 * Filter Bar Component with sorting and filtering controls
 * 
 * Provides a consistent interface for list filtering and sorting:
 * - Sort field selection
 * - Sort direction toggle
 * - Multiple filter dropdowns
 * - Result count display
 * - Active filter chips
 * 
 * @example
 * ```tsx
 * import { RNGFilterBar } from '@/rng-ui/components/RNGFilterBar';
 * 
 * <RNGFilterBar
 *   sortField="name"
 *   sortDirection="asc"
 *   onSortFieldChange={(field) => setSortField(field)}
 *   onSortDirectionChange={(dir) => setSortDirection(dir)}
 *   sortOptions={[
 *     { label: 'Name', value: 'name' },
 *     { label: 'Created Date', value: 'createdAt' },
 *   ]}
 *   filters={[
 *     {
 *       label: 'Type',
 *       value: filterType,
 *       options: [
 *         { label: 'All', value: 'ALL' },
 *         { label: 'Client', value: 'CLIENT' },
 *       ],
 *       onChange: (value) => setFilterType(value),
 *     },
 *   ]}
 *   resultCount={filteredItems.length}
 *   totalCount={allItems.length}
 * />
 * ```
 */
export interface Filter {
  /** Filter label */
  label: string;
  /** Current value */
  value: string;
  /** Available options */
  options: FilterOption[];
  /** Change callback */
  onChange: (value: string) => void;
}

export interface RNGFilterBarProps {
  /** Current sort field */
  sortField?: string;
  
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Sort field change callback */
  onSortFieldChange?: (field: string) => void;
  
  /** Sort direction change callback */
  onSortDirectionChange?: (direction: 'asc' | 'desc') => void;
  
  /** Available sort options */
  sortOptions?: FilterOption[];
  
  /** Filter configurations */
  filters?: Filter[];
  
  /** Number of filtered results */
  resultCount?: number;
  
  /** Total number of items (before filtering) */
  totalCount?: number;
  
  /** Hide sort controls */
  hideSort?: boolean;
  
  /** Hide result count */
  hideCount?: boolean;
}

/**
 * Filter and Sort Bar Component
 * 
 * Provides consistent filtering and sorting UI for list views.
 * Automatically handles direction toggle and displays active filters.
 * 
 * @param props - Component props
 * @returns RNGFilterBar component
 */
export function RNGFilterBar({
  sortField,
  sortDirection = 'asc',
  onSortFieldChange,
  onSortDirectionChange,
  sortOptions = [],
  filters = [],
  resultCount,
  totalCount,
  hideSort = false,
  hideCount = false,
}: RNGFilterBarProps) {
  const handleSortFieldChange = (event: SelectChangeEvent) => {
    if (onSortFieldChange) {
      onSortFieldChange(event.target.value);
    }
  };

  const toggleSortDirection = () => {
    if (onSortDirectionChange) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
    }
  };

  const activeFilters = filters.filter((f) => f.value !== 'ALL' && f.value !== '');
  const isFiltered = resultCount !== undefined && totalCount !== undefined && resultCount !== totalCount;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        {/* Left side: Sort and Filters */}
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 2 }}>
          {/* Sort Controls */}
          {!hideSort && sortOptions.length > 0 && (
            <>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="sort-field-label">
                  <Sort fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                  Sort by
                </InputLabel>
                <Select
                  labelId="sort-field-label"
                  value={sortField || ''}
                  label="Sort by"
                  onChange={handleSortFieldChange}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Chip
                icon={<SwapVert />}
                label={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                onClick={toggleSortDirection}
                variant="outlined"
                sx={{ cursor: 'pointer' }}
              />
            </>
          )}

          {/* Filter Controls */}
          {filters.map((filter, index) => (
            <FormControl key={index} size="small" sx={{ minWidth: 150 }}>
              <InputLabel id={`filter-${index}-label`}>
                <FilterList fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                {filter.label}
              </InputLabel>
              <Select
                labelId={`filter-${index}-label`}
                value={filter.value}
                label={filter.label}
                onChange={(e) => filter.onChange(e.target.value)}
              >
                {filter.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Stack>

        {/* Right side: Result Count */}
        {!hideCount && resultCount !== undefined && (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {isFiltered ? (
              <>
                Showing <strong>{resultCount}</strong> of <strong>{totalCount}</strong> items
              </>
            ) : (
              <>
                <strong>{resultCount}</strong> {resultCount === 1 ? 'item' : 'items'}
              </>
            )}
          </Typography>
        )}
      </Stack>

      {/* Active Filters Chips */}
      {activeFilters.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', mr: 1 }}>
            Active filters:
          </Typography>
          {activeFilters.map((filter, index) => {
            const selectedOption = filter.options.find((opt) => opt.value === filter.value);
            return (
              <Chip
                key={index}
                label={`${filter.label}: ${selectedOption?.label || filter.value}`}
                size="small"
                onDelete={() => filter.onChange('ALL')}
                color="primary"
                variant="outlined"
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
