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
    getOptionValue = (opt: any) =>
      typeof opt === 'string' ? opt : opt.value !== undefined ? opt.value : opt,
    isOptionEqualToValue, // Destructured to exclude from spread
    placeholder,
    ...restItem
  } = item;

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => {
        return (
          <TextField
            {...field}
            select
            fullWidth
            error={!!fieldState.error}
            placeholder={placeholder}
            value={field.value ?? ''}
            // 🛡️ Spread only valid MUI props from mergedItem
            autoFocus={mergedItem.autoFocus}
            disabled={mergedItem.disabled}
            label={mergedItem.label}
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
        );
      }}
    </FieldWrapper>
  );
}
