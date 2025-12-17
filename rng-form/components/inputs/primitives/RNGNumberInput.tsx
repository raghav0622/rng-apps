'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { NumberFieldItem } from '@/rng-form/types';
import { TextField } from '@mui/material';
import { NumericFormat } from 'react-number-format';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RNGNumberInput({ item }: { item: NumberFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <NumericFormat
          customInput={TextField}
          {...field}
          value={field.value ?? ''}
          fullWidth
          placeholder={mergedItem.placeholder}
          decimalScale={mergedItem.type === 'currency' ? 2 : undefined}
          fixedDecimalScale={mergedItem.type === 'currency'}
          allowNegative={mergedItem.min === undefined || mergedItem.min < 0}
          min={mergedItem.min}
          max={mergedItem.max}
          thousandSeparator={mergedItem.type === 'currency' ? ',' : undefined}
          prefix={mergedItem.type === 'currency' ? '₹' : undefined}
          onValueChange={(values) => {
            const floatVal = values.floatValue;
            field.onChange(floatVal === undefined ? '' : floatVal);
          }}
          error={!!fieldState.error}
        />
      )}
    </FieldWrapper>
  );
}
