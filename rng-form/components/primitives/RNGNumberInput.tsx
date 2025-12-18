'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { formatNumber } from '@/rng-form/utils';
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

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [displayValue, setDisplayValue] = useState<string>('');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [isFocused, setIsFocused] = useState(false);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (!isFocused) {
            setDisplayValue(formatNumber(field.value, options));
          }
        }, [field.value, isFocused, options]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value;
          // Allow typing numbers, minus, decimal
          if (/^-?\d*\.?\d*$/.test(val)) {
            setDisplayValue(val);
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

          const parsedNumber = parseFloat(rawVal);
          if (!isNaN(parsedNumber)) {
            field.onChange(parsedNumber);
            setDisplayValue(formatNumber(parsedNumber, options));
          } else {
            setDisplayValue(formatNumber(field.value, options));
          }
        };

        const handleFocus = () => {
          setIsFocused(true);
          if (field.value !== null && field.value !== undefined) {
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
            inputMode="decimal"
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
