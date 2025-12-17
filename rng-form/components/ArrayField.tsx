'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormBuilder } from '@/rng-form/components/FormBuilder';
import { FormSchema, LayoutItem } from '@/rng-form/types';
import { Add, Delete } from '@mui/icons-material';
import { Box, Button, Grid, IconButton, Paper, Typography } from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RNGArrayFieldProps<S extends FormSchema> {
  item: LayoutItem<S> & { type: 'array' };
  pathPrefix?: string;
}

export function RNGArrayField<S extends FormSchema>({ item }: RNGArrayFieldProps<S>) {
  const { control } = useFormContext();

  return (
    <FieldWrapper item={item} name={item.name}>
      {() => <ArrayFieldContent item={item} control={control} />}
    </FieldWrapper>
  );
}

function ArrayFieldContent({
  item,
  control,
}: {
  item: LayoutItem<any> & { type: 'array' };
  control: any;
}) {
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
            {/* pathPrefix construction is key here:
              parentName.0.fieldName 
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
