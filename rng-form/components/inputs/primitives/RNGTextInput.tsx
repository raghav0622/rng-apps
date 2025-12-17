'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { TextFieldItem } from '@/rng-form/types';
import { TextField } from '@mui/material';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RNGTextInput({ item }: { item: TextFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          fullWidth
          // Label is handled externally by FieldWrapper for consistency
          label={undefined}
          type={mergedItem.type}
          placeholder={mergedItem.placeholder}
          multiline={mergedItem.multiline}
          rows={mergedItem.rows}
          error={!!fieldState.error}
          variant="outlined"
        />
      )}
    </FieldWrapper>
  );
}
