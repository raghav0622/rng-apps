'use client';

import { FieldWrapper } from '@/rng-form/components/FieldWrapper'; // ✅ Import Wrapper
import { formatNumber } from '@/rng-form/utils';
import { evaluateMathExpression } from '@/rng-form/utils/math';
import { TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { FormSchema, InputItem } from '../../types';

interface RNGNumberInputProps<S extends FormSchema> {
  item: InputItem<S> & {
    type: 'number';
    formatOptions?: Intl.NumberFormatOptions;
    enableMath?: boolean;
    min?: number;
    max?: number;
  };
  pathPrefix?: string; // ✅ Added to support scoped names
}

export function RNGNumberInput<S extends FormSchema>({ item, pathPrefix }: RNGNumberInputProps<S>) {
  // ✅ 1. Get Control directly (Logic retained)
  const { control } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({
    name: item.name!,
    control,
    rules: {
      required: item.required ? 'This field is required' : false,
      min: item.min,
      max: item.max,
    },
  });

  // Setup Options
  const options = item.formatOptions || {};
  const enableMath = !!item.enableMath;

  // --- STATE & LOGIC (Preserved Exactly) ---
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      // Handle null/undefined gracefully
      const val = field.value !== null && field.value !== undefined ? field.value : '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayValue(val === '' ? '' : formatNumber(val, options));
    }
  }, [field.value, isFocused, options]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (enableMath) {
      // Allow math characters but block newlines
      if (!val.includes('\n')) {
        setDisplayValue(val);
      }
    } else {
      // Standard number filtering
      if (/^-?\d*\.?\d*$/.test(val)) {
        setDisplayValue(val);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    field.onBlur();

    const rawVal = e.target.value;

    if (rawVal === '' || rawVal === '-') {
      field.onChange(null);
      setDisplayValue('');
      return;
    }

    let finalNumber: number | null = null;

    if (enableMath) {
      finalNumber = evaluateMathExpression(rawVal);
    }

    // Fallback parsing
    if (finalNumber === null) {
      const parsed = parseFloat(rawVal);
      if (!isNaN(parsed) && isFinite(parsed)) {
        finalNumber = parsed;
      }
    }

    if (finalNumber !== null) {
      field.onChange(finalNumber);
      // Re-format on blur
      setDisplayValue(formatNumber(finalNumber, options));
    } else {
      // Revert to last valid
      const val = field.value !== null && field.value !== undefined ? field.value : '';
      setDisplayValue(val === '' ? '' : formatNumber(val, options));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (field.value !== null && field.value !== undefined) {
      // Show raw number on edit
      setDisplayValue(String(field.value));
    } else {
      setDisplayValue('');
    }
  };

  return (
    // ✅ Wrapped in FieldWrapper
    // We ignore the wrapper's render props and use our top-level logic/handlers
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {() => (
        <TextField
          {...field}
          // ✅ UI: Use hiddenLabel to prevent conflict with FieldWrapper's label
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          fullWidth
          variant="outlined"
          type="text"
          inputMode={enableMath ? 'text' : 'decimal'}
          placeholder={item.placeholder}
          error={!!error}
          disabled={item.disabled}
          slotProps={{
            htmlInput: {
              min: item.min,
              max: item.max,
            },
          }}
        />
      )}
    </FieldWrapper>
  );
}
