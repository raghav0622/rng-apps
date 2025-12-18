'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { TextField } from '@mui/material';

// We allow this component to handle both 'text' and 'password' items
interface RNGTextInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'text' | 'password' };
}

export function RNGTextInput<S extends FormSchema>({ item }: RNGTextInputProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <TextField
          {...field}
          fullWidth
          type={mergedItem.type === 'password' ? 'password' : 'text'}
          placeholder={mergedItem.placeholder}
          multiline={mergedItem.type === 'text' && mergedItem.multiline}
          rows={mergedItem.type === 'text' ? mergedItem.rows : undefined}
          error={!!fieldState.error}
          // Explicitly map value to avoid uncontrolled/controlled warnings
          value={field.value ?? ''}
        />
      )}
    </FieldWrapper>
  );
}
