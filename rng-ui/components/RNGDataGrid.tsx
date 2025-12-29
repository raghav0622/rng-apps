'use client';

import { Paper, alpha, useTheme } from '@mui/material';
import { DataGrid, DataGridProps, GridColDef, GridToolbar } from '@mui/x-data-grid';

interface RNGDataGridProps extends Omit<DataGridProps, 'sx'> {
  /**
   * Column Definitions
   */
  columns: GridColDef[];
  /**
   * Data Rows
   */
  rows: any[];
  /**
   * Loading State
   */
  loading?: boolean;
  /**
   * Enable Toolbar (Filter, Export, Density)
   * @default true
   */
  showToolbar?: boolean;
  /**
   * Height of the grid container
   * @default 500
   */
  height?: number | string;
}

/**
 * 🎨 RNGDataGrid
 * The flagship data display component.
 * Features: Sorting, Filtering, Pagination, Density, and Bulk Actions.
 */
export function RNGDataGrid({
  columns,
  rows,
  loading = false,
  showToolbar = true,
  height = 500,
  ...props
}: RNGDataGridProps) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        height: height,
        width: '100%',
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        slots={{
          toolbar: showToolbar ? GridToolbar : undefined,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'var(--mui-palette-action-hover)',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'text.secondary',
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
              },
            },
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
          },
        }}
        pagination
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection
        disableRowSelectionOnClick
        {...props}
      />
    </Paper>
  );
}
