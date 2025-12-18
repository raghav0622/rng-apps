'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { TextField } from '@mui/material';

interface RNGDateInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'date' };
}

export function RNGDateInput<S extends FormSchema>({ item }: RNGDateInputProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <TextField
          {...field}
          type="date"
          fullWidth
          disabled={mergedItem.disabled}
          error={!!fieldState.error}
          // Handle string vs Date object for input value
          value={
            field.value instanceof Date
              ? field.value.toISOString().split('T')[0]
              : (field.value ?? '')
          }
          // Convert back to Date object on change
          onChange={(e) => field.onChange((e.target as HTMLInputElement).valueAsDate)}
        />
      )}
    </FieldWrapper>
  );
}
