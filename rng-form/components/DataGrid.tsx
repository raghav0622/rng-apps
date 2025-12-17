'use client';

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
  Typography,
} from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { DataGridItem } from '../types';
import { FieldWrapper } from './FieldWrapper';
import { FormBuilder } from './FormBuilder';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGDataGrid({ item }: { item: DataGridItem<any> }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: item.name,
  });

  const handleAddRow = () => {
    append(item.defaultValue || {});
  };

  return (
    <FieldWrapper item={item} name={item.name}>
      {() => (
        <Box sx={{ width: '100%', mt: 1 }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  {item.columns.map((col, idx) => (
                    <TableCell key={idx} width={col.width}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {col.header}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell width={50} align="center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, rowIndex) => (
                  <TableRow key={field.id}>
                    {item.columns.map((col, colIndex) => {
                      // Construct a pseudo-schema for the cell so FormBuilder can render it
                      // We need to rewrite the name to be array-indexed: "myArray.0.fieldName"
                      const cellItem = {
                        ...col.field,
                        name: `${item.name}.${rowIndex}.${col.field.name}`,
                        // Remove label to fit in table cell cleanly
                        label: undefined,
                      };
                      return (
                        <TableCell key={colIndex} sx={{ verticalAlign: 'top', pt: 2 }}>
                          <FormBuilder uiSchema={[cellItem as any]} />
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ verticalAlign: 'top', pt: 2 }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => remove(rowIndex)}
                        aria-label="Delete Row"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {fields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={item.columns.length + 1} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No data available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            startIcon={<Add />}
            onClick={handleAddRow}
            sx={{ mt: 1 }}
            variant="outlined"
            size="small"
          >
            Add Row
          </Button>
        </Box>
      )}
    </FieldWrapper>
  );
}
