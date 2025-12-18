'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Autocomplete, TextField } from '@mui/material';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Helper to safe compare options
const compareOptions = (opt: any, val: any) => {
  if (!val) return false;
  const optVal = typeof opt === 'string' ? opt : opt.value;
  const fieldVal = typeof val === 'string' ? val : val.value;
  return optVal === fieldVal;
};

// --- SYNC AUTOCOMPLETE ---
interface RNGAutocompleteProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'autocomplete' };
}

export function RNGAutocomplete<S extends FormSchema>({ item }: RNGAutocompleteProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Autocomplete
          {...field}
          multiple={mergedItem.multiple}
          options={mergedItem.options as readonly any[]}
          getOptionLabel={
            mergedItem.getOptionLabel ||
            ((opt) => (typeof opt === 'string' ? opt : (opt as any).label || ''))
          }
          isOptionEqualToValue={compareOptions}
          onChange={(_, data) => field.onChange(data)}
          disabled={mergedItem.disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={mergedItem.label}
              variant="outlined"
              error={!!_?.error}
            />
          )}
        />
      )}
    </FieldWrapper>
  );
}
