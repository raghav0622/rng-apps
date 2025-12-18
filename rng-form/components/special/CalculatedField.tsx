'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { TextField } from '@mui/material';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RNGCalculatedFieldProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'calculated' };
}

export function RNGCalculatedField<S extends FormSchema>({ item }: RNGCalculatedFieldProps<S>) {
  const { control, setValue, getValues } = useFormContext();

  // Strategy:
  // 1. We use useWatch to subscribe to changes.
  //    - If dependencies are provided, we watch only those to optimize re-renders.
  //    - If no dependencies, we watch everything (undefined name).
  // 2. We use getValues() inside the effect to retrieve the full form structure.
  //    This ensures the 'calculate' function receives the correct shape (z.infer<S>)
  //    without us trying to reconstruct objects from the partial arrays useWatch returns.

  const hasDependencies = item.dependencies && item.dependencies.length > 0;

  const triggerValues = useWatch({
    control,
    name: hasDependencies ? (item.dependencies as any) : undefined,
  });

  useEffect(() => {
    // Get fresh values matching the schema shape
    // We cast generic _formValues hack is NO LONGER NEEDED with getValues()
    const currentValues = getValues() as z.infer<S>;

    const result = item.calculate(currentValues);

    setValue(item.name as string, result, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [triggerValues, item, setValue, getValues]);

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
