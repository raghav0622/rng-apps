'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { InputAdornment, TextField } from '@mui/material';

interface RNGNumberInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'number' | 'currency' };
}

export function RNGNumberInput<S extends FormSchema>({ item }: RNGNumberInputProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => {
        const isCurrency = mergedItem.type === 'currency';

        return (
          <TextField
            {...field}
            fullWidth
            type="number"
            placeholder={mergedItem.placeholder}
            error={!!fieldState.error}
            value={field.value ?? ''}
            onChange={(e) => {
              // Ensure we pass a number back to the form state
              const val = e.target.value === '' ? '' : Number(e.target.value);
              field.onChange(val);
            }}
            slotProps={{
              input: {
                startAdornment: isCurrency ? (
                  <InputAdornment position="start">{mergedItem.currencyCode || '₹'}</InputAdornment>
                ) : undefined,
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
