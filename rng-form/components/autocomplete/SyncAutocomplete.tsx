'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Autocomplete, TextField } from '@mui/material';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RNGAutocompleteProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'autocomplete' };
  pathPrefix?: string;
}

export function RNGAutocomplete<S extends FormSchema>({
  item,
  pathPrefix,
}: RNGAutocompleteProps<S>) {
  const {
    options,
    getOptionLabel = (opt: any) => (typeof opt === 'string' ? opt : opt.label || String(opt)),
    getOptionValue = (opt: any) => (typeof opt === 'string' ? opt : opt.value !== undefined ? opt.value : opt),
    isOptionEqualToValue = (opt: any, val: any) => {
      if (!val) return false;
      const optVal = getOptionValue(opt);
      const fieldVal = typeof val === 'object' && val !== null ? getOptionValue(val) : val;
      return optVal === fieldVal;
    }
  } = item;

  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, fieldState, mergedItem) => {
        const value = field.value === undefined ? (mergedItem.multiple ? [] : null) : field.value;

        return (
          <Autocomplete
            {...field}
            value={value}
            multiple={mergedItem.multiple}
            options={options as readonly any[]}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={(_, data) => field.onChange(data)}
            disabled={mergedItem.disabled}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={mergedItem.placeholder || mergedItem.label}
                variant="outlined"
                error={!!fieldState.error}
              />
            )}
          />
        );
      }}
    </FieldWrapper>
  );
}
