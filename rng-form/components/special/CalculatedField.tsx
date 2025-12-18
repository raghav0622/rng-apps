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

  const hasDependencies = item.dependencies && item.dependencies.length > 0;

  // Watch dependencies
  const triggerValues = useWatch({
    control,
    name: hasDependencies ? (item.dependencies as any) : undefined,
  });

  useEffect(() => {
    const currentValues = getValues() as z.infer<S>;

    // Calculate new result
    const result = item.calculate(currentValues);

    // Get current field value to compare
    const currentFieldValue = getValues(item.name as any);

    // OPTIMIZATION: Only update if value actually changed.
    // We use loose equality (==) or simple strict (===).
    // If result is an object, this might need deep comparison, but for calculated fields (usually primitives), this prevents loops.
    if (result !== currentFieldValue) {
      setValue(item.name as string, result, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [triggerValues, item, setValue, getValues]);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          fullWidth
          // Calculated fields are effectively read-only
          // But passing disabled=true prevents submission in standard HTML forms (though RHF handles it manually).
          // Visually we want it disabled or read-only.
          inputProps={{ readOnly: true }}
          disabled={mergedItem.disabled} // Allow explicit disable styling
          label={mergedItem.label}
          variant="filled"
        />
      )}
    </FieldWrapper>
  );
}
