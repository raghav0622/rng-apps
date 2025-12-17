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
  const { control, setValue } = useFormContext();

  const watchedValues = useWatch({
    control,
    name: (item.dependencies as any) || [],
  });

  useEffect(() => {
    if (!item.dependencies || item.dependencies.length === 0) return;

    // Fix: Cast _formValues (FieldValues) to z.infer<S>
    // We use 'unknown' first to escape strict overlap checks
    const currentValues = (control as any)._formValues as unknown as z.infer<S>;

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
