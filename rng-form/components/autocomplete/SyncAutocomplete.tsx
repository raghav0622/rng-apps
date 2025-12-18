'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Autocomplete, TextField } from '@mui/material';

/* eslint-disable @typescript-eslint/no-explicit-any */

const compareOptions = (opt: any, val: any) => {
  if (!val) return false;
  const optVal = typeof opt === 'string' ? opt : opt.value;
  const fieldVal = typeof val === 'string' ? val : val.value;
  return optVal === fieldVal;
};

interface RNGAutocompleteProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'autocomplete' };
  pathPrefix?: string; // <--- Added
}

export function RNGAutocomplete<S extends FormSchema>({
  item,
  pathPrefix,
}: RNGAutocompleteProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, _, mergedItem) => {
        // Fix: Default to null/[] if undefined to prevent controlled/uncontrolled error
        const value = field.value === undefined ? (mergedItem.multiple ? [] : null) : field.value;

        return (
          <Autocomplete
            {...field}
            value={value}
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
        );
      }}
    </FieldWrapper>
  );
}
