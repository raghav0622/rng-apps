'use client';
import { TextField } from '@mui/material';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CalculatedItem } from '../types';
import { FieldWrapper } from './FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGCalculatedField({ item }: { item: CalculatedItem<any> }) {
  const { control, setValue } = useFormContext();

  // Watch all fields so calculation updates on any change
  // Note: Optimally, item.dependencies should be passed here if available
  const values = useWatch({ control, name: item.dependencies as any });

  useEffect(() => {
    // We get the full form values to pass to the calculator
    // This requires accessing control._formValues or careful useWatch
    // For safety, we use the `values` from useWatch if dependencies exist,
    // otherwise we might risk not updating.
    // If dependencies are not provided, we might default to watching everything
    // but that is expensive. For now, we assume dependencies ARE provided for best perf.

    // We need the *entire* form state for the calculate function usually:
    const currentValues = control._formValues;
    const result = item.calculate(currentValues);

    // Only update if changed to avoid loops
    setValue(item.name as string, result, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [values, item, setValue, control]);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          fullWidth
          disabled // Calculated fields are always read-only
          label={mergedItem.label}
          variant="filled" // Visual cue that it is auto-filled
        />
      )}
    </FieldWrapper>
  );
}
