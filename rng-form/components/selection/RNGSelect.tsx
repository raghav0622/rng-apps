'use client';

import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { MenuItem, TextField } from '@mui/material';

interface RNGSelectProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'select' };
}

export function RNGSelect<S extends FormSchema>({ item }: RNGSelectProps<S>) {
  const {
    options,
    getOptionLabel = (opt: any) => (typeof opt === 'string' ? opt : opt.label || String(opt)),
    getOptionValue = (opt: any) => (typeof opt === 'string' ? opt : opt.value !== undefined ? opt.value : opt),
    placeholder,
  } = item;

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <TextField
          {...field}
          select
          fullWidth
          error={!!fieldState.error}
          placeholder={placeholder}
          // Mapping value to empty string if null/undefined for controlled safety
          value={field.value ?? ''}
          {...mergedItem}
        >
          {options.map((option, index) => {
            const label = getOptionLabel(option);
            const value = getOptionValue(option);
            
            return (
              <MenuItem key={`${item.name}-opt-${index}`} value={value}>
                {label}
              </MenuItem>
            );
          })}
        </TextField>
      )}
    </FieldWrapper>
  );
}
