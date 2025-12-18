'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { formatNumber } from '@/rng-form/utils';
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

  const triggerValues = useWatch({
    control,
    name: hasDependencies ? (item.dependencies as any) : undefined,
  });

  useEffect(() => {
    const currentValues = getValues() as z.infer<S>;
    let result: string | number = '';

    try {
      result = item.calculate(currentValues);
    } catch (e) {
      // ignore calc errors
    }

    const currentFieldValue = getValues(item.name as any);
    if (result != currentFieldValue) {
      setValue(item.name as string, result, {
        shouldValidate: true,
        shouldDirty: false,
        shouldTouch: true,
      });
    }
  }, [triggerValues, item, setValue, getValues]);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => {
        // Format the display value (e.g., "500 sqft")
        const displayValue = mergedItem.formatOptions
          ? formatNumber(field.value, mergedItem.formatOptions)
          : (field.value ?? '');

        return (
          <TextField
            {...field}
            value={displayValue}
            fullWidth
            inputProps={{ readOnly: true }}
            disabled={mergedItem.disabled}
            label={mergedItem.label}
            variant="filled"
            sx={{
              backgroundColor: 'action.hover',
              '& .MuiInputBase-input': { cursor: 'default' },
            }}
          />
        );
      }}
    </FieldWrapper>
  );
}
