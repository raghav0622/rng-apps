'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Box, TextField } from '@mui/material';

interface RNGColorInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'color' };
}

export function RNGColorInput<S extends FormSchema>({ item }: RNGColorInputProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            {...field}
            type="color"
            sx={{ width: 80, p: 0, '& input': { p: 0.5, height: 40, cursor: 'pointer' } }}
            error={!!fieldState.error}
          />
          <TextField
            {...field}
            fullWidth
            placeholder="#000000"
            error={!!fieldState.error}
            value={field.value ?? ''}
            onChange={(e) => field.onChange(e.target.value)}
          />
        </Box>
      )}
    </FieldWrapper>
  );
}
