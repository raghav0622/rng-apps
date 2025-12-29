'use client';

import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Toolbar,
  Typography,
  Paper,
  Box,
  Skeleton,
} from '@mui/material';
import { ReactNode, useState } from 'react';

interface RNGTableColumn<T> {
  id: keyof T | (string & {});
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
}

interface RNGTableProps<T> {
  columns: RNGTableColumn<T>[];
  data: T[];
  renderRow: (row: T, index: number) => ReactNode;
  toolbarActions?: ReactNode;
  title: string;
  isLoading?: boolean;
}

export function RNGTable<T>({ columns, data, renderRow, toolbarActions, title, isLoading }: RNGTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          bgcolor: 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" component="div">
          {title}
        </Typography>
        {toolbarActions}
      </Toolbar>
      <TableContainer>
        <MuiTable stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id as string}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{ fontWeight: 600 }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(rowsPerPage)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.id as string}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(renderRow)
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
