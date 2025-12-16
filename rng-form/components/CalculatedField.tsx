/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { TextField } from '@mui/material';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CalculatedItem } from '../types';
import { FieldWrapper } from './FieldWrapper';

export function RNGCalculatedField({ item }: { item: CalculatedItem<any> }) {
  const { control, setValue, getValues } = useFormContext();

  // Watch dependencies to trigger recalculation
  const watchedValues = useWatch({
    control,
    name: item.dependencies as any,
  });

  useEffect(() => {
    const currentValues = getValues();
    let result: string | number = '';
    try {
      result = item.calculate(currentValues);
    } catch (e) {}

    if (item.name) {
      setValue(item.name as string, result, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchedValues, item, setValue, getValues]);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <TextField
          {...field}
          fullWidth
          // Fix 1: Hide internal label so we don't have duplicates (Wrapper handles it)
          hiddenLabel
          // Fix 2: Use readOnly instead of disabled so value is SUBMITTED
          slotProps={{
            input: {
              readOnly: true,
              tabIndex: -1, // Prevent tabbing into it
              sx: {
                bgcolor: 'action.hover',
                cursor: 'default',
                pointerEvents: 'none', // Mimic disabled feel
              },
            },
          }}
          error={!!fieldState.error}
          variant="outlined"
        />
      )}
    </FieldWrapper>
  );
}
