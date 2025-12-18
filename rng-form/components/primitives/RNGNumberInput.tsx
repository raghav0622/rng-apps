'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { formatNumber } from '@/rng-form/utils';
import { evaluateMathExpression } from '@/rng-form/utils/math';
import { TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface RNGNumberInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'number' };
}

export function RNGNumberInput<S extends FormSchema>({ item }: RNGNumberInputProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => {
        const options = mergedItem.formatOptions || {};
        const enableMath = !!mergedItem.enableMath;

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [displayValue, setDisplayValue] = useState<string>('');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [isFocused, setIsFocused] = useState(false);

        // Sync external value changes when not focused
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (!isFocused) {
            setDisplayValue(formatNumber(field.value, options));
          }
        }, [field.value, isFocused, options]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value;

          if (enableMath) {
            // MATH MODE:
            // We must allow letters (for functions like 'sqrt', 'max'),
            // symbols ((), ^, %, !), and numbers.
            // We essentially only block newlines to keep it a single-line input.
            // The validation happens on Blur.
            if (!val.includes('\n')) {
              setDisplayValue(val);
            }
          } else {
            // STANDARD MODE:
            // Strict number/decimal input filter.
            if (/^-?\d*\.?\d*$/.test(val)) {
              setDisplayValue(val);
            }
          }
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
          setIsFocused(false);
          field.onBlur();

          const rawVal = e.target.value;

          // Handle empty or incomplete input
          if (rawVal === '' || rawVal === '-') {
            field.onChange(null);
            setDisplayValue('');
            return;
          }

          let finalNumber: number | null = null;

          if (enableMath) {
            // 1. Try to evaluate as a mathjs expression
            // This now supports "sqrt(16)", "5^2", "max(10, 5)", etc.
            finalNumber = evaluateMathExpression(rawVal);
          }

          // 2. Fallback: If math eval failed (or was disabled), try standard parsing
          if (finalNumber === null) {
            // We use parseFloat to handle simple strings that mathjs might have rejected
            // or if math was disabled.
            const parsed = parseFloat(rawVal);
            if (!isNaN(parsed) && isFinite(parsed)) {
              finalNumber = parsed;
            }
          }

          if (finalNumber !== null) {
            // Update the form state with the calculated numeric result
            field.onChange(finalNumber);
            // Update the UI to show the formatted result (e.g. "150.00")
            // Note: We deliberately replace the expression (e.g. "=5+5") with the result ("10")
            // mirroring Excel's behavior when leaving the cell.
            setDisplayValue(formatNumber(finalNumber, options));
          } else {
            // Invalid input: Revert to the last valid known value
            setDisplayValue(formatNumber(field.value, options));
          }
        };

        const handleFocus = () => {
          setIsFocused(true);
          if (field.value !== null && field.value !== undefined) {
            // On focus, show the raw number so it can be edited
            setDisplayValue(String(field.value));
          } else {
            setDisplayValue('');
          }
        };

        return (
          <TextField
            {...field}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            fullWidth
            type="text"
            // Use 'text' inputMode if math is enabled to allow full keyboard (letters for functions),
            // otherwise 'decimal' for mobile number pads.
            inputMode={enableMath ? 'text' : 'decimal'}
            placeholder={mergedItem.placeholder}
            error={!!fieldState.error}
            slotProps={{
              input: {
                inputProps: {
                  min: mergedItem.min,
                  max: mergedItem.max,
                },
              },
            }}
          />
        );
      }}
    </FieldWrapper>
  );
}
