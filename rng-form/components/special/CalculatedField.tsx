'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { formatNumber } from '@/rng-form/utils';
import { TextField } from '@mui/material';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';

interface RNGCalculatedFieldProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'calculated' };
  pathPrefix?: string; // ✅ Added support for scoped paths
}

export function RNGCalculatedField<S extends FormSchema>({
  item,
  pathPrefix,
}: RNGCalculatedFieldProps<S>) {
  const { control, setValue, getValues } = useFormContext();
  const hasDependencies = item.dependencies && item.dependencies.length > 0;

  // Watch dependencies to trigger re-calculation
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
      // ignore calc errors silently
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
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, _, mergedItem) => {
        // 🛡️ Safe check for 'formatOptions'
        const formatOptions =
          'formatOptions' in mergedItem ? (mergedItem as any).formatOptions : undefined;

        // Format the display value (e.g., "500 sqft")
        const displayValue = formatOptions
          ? formatNumber(field.value, formatOptions)
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
