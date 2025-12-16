'use client';

import { TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CalculatedItem } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RNGCalculatedFieldProps {
  item: CalculatedItem<any>;
}

export function RNGCalculatedField({ item }: RNGCalculatedFieldProps) {
  const { control, setValue, getValues } = useFormContext();

  // Watch specific dependencies to trigger updates
  const watchedValues = useWatch({
    control,
    name: item.dependencies as any,
  });

  useEffect(() => {
    // 1. Get the latest state of the entire form
    const currentValues = getValues();

    // 2. Perform calculation
    let result: string | number = '';
    try {
      result = item.calculate(currentValues);
    } catch (e) {
      console.error('Error in CalculatedField:', e);
    }

    // 3. Update the form value so it is included in submission (data)
    if (item.name) {
      setValue(item.name as string, result, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchedValues, item, setValue, getValues]);

  // We read the value back from the form to ensure the UI is in sync with the form state
  const displayValue = useWatch({
    control,
    name: item.name as string,
  });

  return (
    <Grid size={12} {...item.colProps}>
      <TextField
        fullWidth
        label={item.label}
        value={displayValue || ''} // Show the registered form value
        helperText={item.description}
        disabled
        slotProps={{
          input: {
            readOnly: true,
            sx: { bgcolor: 'action.hover', cursor: 'default' },
          },
        }}
        variant="filled"
      />
    </Grid>
  );
}
