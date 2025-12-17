'use client';
import { TextField } from '@mui/material';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CalculatedItem } from '../../types';
import { FieldWrapper } from '../FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGCalculatedField({ item }: { item: CalculatedItem<any> }) {
  const { control, setValue } = useFormContext();

  // Optimized watch: only re-render when dependencies change.
  // If no dependencies are listed, this optimization is lost and it may not trigger on every change efficiently.
  const watchedValues = useWatch({
    control,
    name: (item.dependencies as any) || [],
  });

  useEffect(() => {
    // If no dependencies are provided, we shouldn't run this effect continuously to avoid loops.
    // We assume explicit dependencies for calculation.
    if (!item.dependencies || item.dependencies.length === 0) return;

    // Use current form values for calculation
    const currentValues = control._formValues;
    const result = item.calculate(currentValues);

    setValue(item.name as string, result, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [watchedValues, item, setValue, control]);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          fullWidth
          disabled // Calculated fields are always read-only
          label={mergedItem.label}
          variant="filled"
        />
      )}
    </FieldWrapper>
  );
}
