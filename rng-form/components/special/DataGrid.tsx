'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { RenderItem } from '@/rng-form/components/RenderItem';
import { useFieldLogic } from '@/rng-form/hooks/useFieldLogic'; // Import the hook
import { FormItem, FormSchema, LayoutItem } from '@/rng-form/types';
import { Add, Delete } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RNGDataGridProps<S extends FormSchema> {
  item: LayoutItem<S> & { type: 'data-grid' };
  pathPrefix?: string;
}

export function RNGDataGrid<S extends FormSchema>({ item }: RNGDataGridProps<S>) {
  const { control } = useFormContext();

  return (
    <FieldWrapper item={item} name={item.name}>
      {() => <DataGridContent item={item} control={control} />}
    </FieldWrapper>
  );
}

// Internal Wrapper to apply logic (propsLogic/renderLogic) to individual cells
function DataGridCell<S extends FormSchema>({
  item,
  pathPrefix,
}: {
  item: FormItem<S>;
  pathPrefix: string;
}) {
  // 1. Run Logic Hook
  const { isVisible, mergedItem } = useFieldLogic(item, pathPrefix);

  // 2. Handle Visibility (Optional: usually keep cells for layout stability, but render empty if hidden)
  if (!isVisible) {
    return <Box sx={{ minWidth: 120, height: 40, bgcolor: 'action.hover' }} />;
  }

  // 3. Render with Merged Props (enables disabled logic, dynamic labels, etc.)
  return (
    <Box sx={{ '& .MuiFormControl-root': { mb: 0 }, minWidth: 120 }}>
      <RenderItem item={mergedItem} pathPrefix={pathPrefix} />
    </Box>
  );
}

function DataGridContent({
  item,
  control,
}: {
  item: LayoutItem<any> & { type: 'data-grid' };
  control: any;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: item.name as string,
  });

  return (
    <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden', mb: 2 }}>
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {item.columns.map((col, idx) => (
                <TableCell key={idx} sx={{ width: col.width, fontWeight: 600 }}>
                  {col.header}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ width: 50 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id} hover>
                {item.columns.map((col, colIdx) => (
                  <TableCell key={colIdx}>
                    {/* USE THE WRAPPER HERE instead of direct RenderItem */}
                    <DataGridCell item={col.field} pathPrefix={`${item.name}.${index}`} />
                  </TableCell>
                ))}
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => remove(index)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={item.columns.length + 1} align="center" sx={{ py: 3 }}>
                  No data. Click below to add.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button startIcon={<Add />} onClick={() => append(item.defaultValue || {})} size="small">
          Add Row
        </Button>
      </Box>
    </Paper>
  );
}
