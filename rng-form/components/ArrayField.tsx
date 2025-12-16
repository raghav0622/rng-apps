'use client';
import { Add, Delete } from '@mui/icons-material';
import { Box, Button, IconButton, Paper, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FieldWrapper } from '../FieldWrapper';
import { ArrayItem, FormSchema } from '../types';
import { FormBuilder } from './FormBuilder';

export function RNGArrayField<S extends FormSchema>({ item }: { item: ArrayItem<S> }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: item.name,
  });

  return (
    <FieldWrapper item={item}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {item.label}
        </Typography>
        {item.description && <Typography variant="caption">{item.description}</Typography>}
      </Box>

      {fields.map((field, index) => (
        <Paper
          key={field.id}
          variant="outlined"
          sx={{ p: 2, mb: 2, position: 'relative', bgcolor: 'background.default' }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <Box flexGrow={1}>
              <Grid container spacing={2}>
                {/* Recursive Render: Pass the current index path prefix */}
                <FormBuilder uiSchema={item.items} pathPrefix={`${item.name}.${index}`} />
              </Grid>
            </Box>
            <IconButton color="error" onClick={() => remove(index)} aria-label="Remove item">
              <Delete />
            </IconButton>
          </Stack>
        </Paper>
      ))}

      <Button
        startIcon={<Add />}
        variant="outlined"
        onClick={() => {
          // Use provided default value or fallback to empty object
          append(item.defaultValue || {});
        }}
      >
        {item.itemLabel || 'Add Item'}
      </Button>
    </FieldWrapper>
  );
}
