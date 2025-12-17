'use client';
import { Add, Delete } from '@mui/icons-material';
import { Box, Button, IconButton, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { ArrayItem } from '../types';
import { FieldWrapper } from './FieldWrapper';
import { FormBuilder } from './FormBuilder';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGArrayField({ item }: { item: ArrayItem<any> }) {
  const { control } = useFormContext();

  // We use FieldWrapper mostly for layout/logic, but we need the raw Name for useFieldArray
  return (
    <FieldWrapper item={item} name={item.name}>
      {() => <ArrayFieldContent item={item} control={control} />}
    </FieldWrapper>
  );
}

function ArrayFieldContent({ item, control }: { item: ArrayItem<any>; control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: item.name as string,
  });

  return (
    <Box sx={{ width: '100%' }}>
      {fields.map((field, index) => (
        <Paper key={field.id} sx={{ p: 2, mb: 2, position: 'relative' }} variant="outlined">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {item.itemLabel || 'Item'} #{index + 1}
            </Typography>
            <IconButton size="small" onClick={() => remove(index)} color="error">
              <Delete />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            {/* We render the children schema for THIS index.
               The FormBuilder needs a `pathPrefix` to know where these fields live.
               pathPrefix = "parentName.0", "parentName.1" etc.
            */}
            <FormBuilder uiSchema={item.items} pathPrefix={`${item.name}.${index}`} />
          </Grid>
        </Paper>
      ))}

      <Button
        variant="outlined"
        startIcon={<Add />}
        onClick={() => append(item.defaultValue || {})}
      >
        Add {item.itemLabel || 'Item'}
      </Button>
    </Box>
  );
}
