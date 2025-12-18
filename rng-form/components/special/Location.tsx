'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Search } from '@mui/icons-material';
import { Box, InputAdornment, Stack, TextField } from '@mui/material';

interface RNGLocationProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'location' };
}

export function RNGLocation<S extends FormSchema>({ item }: RNGLocationProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          <TextField
            fullWidth
            label="Address Search"
            placeholder={mergedItem.placeholder || 'Enter location...'}
            disabled={mergedItem.disabled}
            value={field.value?.address || ''}
            onChange={(e) => field.onChange({ ...field.value, address: e.target.value })}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Stack direction="row" spacing={1}>
            <TextField
              label="City"
              size="small"
              disabled={mergedItem.disabled}
              value={field.value?.city || ''}
              onChange={(e) => field.onChange({ ...field.value, city: e.target.value })}
            />
            <TextField
              label="State"
              size="small"
              disabled={mergedItem.disabled}
              value={field.value?.state || ''}
              onChange={(e) => field.onChange({ ...field.value, state: e.target.value })}
            />
            <TextField
              label="Zip"
              size="small"
              disabled={mergedItem.disabled}
              value={field.value?.zip || ''}
              onChange={(e) => field.onChange({ ...field.value, zip: e.target.value })}
            />
          </Stack>
        </Box>
      )}
    </FieldWrapper>
  );
}
