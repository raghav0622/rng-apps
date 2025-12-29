'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { TextField } from '@mui/material';

interface RNGTextInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'text' | 'email' | 'password' | 'url' | 'tel' };
  pathPrefix?: string;
}

export function RNGTextInput<S extends FormSchema>({ item, pathPrefix }: RNGTextInputProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, fieldState, mergedItem) => {
        // 🛡️ Safe access for helperText

        return (
          <TextField
            {...field}
            // label={mergedItem.label}
            // hiddenLabel
            placeholder={mergedItem.placeholder}
            type={mergedItem.type}
            error={!!fieldState.error}
            disabled={mergedItem.disabled}
            fullWidth
            variant="outlined"
          />
        );
      }}
    </FieldWrapper>
  );
}
