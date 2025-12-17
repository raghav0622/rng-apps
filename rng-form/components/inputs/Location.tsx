'use client';
import { Search } from '@mui/icons-material';
import { Box, InputAdornment, Stack, TextField } from '@mui/material';
import { LocationItem } from '../../types';
import { FieldWrapper } from '../FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGLocation({ item }: { item: LocationItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field) => (
        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          <TextField
            fullWidth
            label="Address Search"
            placeholder="Enter location..."
            value={field.value?.address || ''}
            onChange={(e) => field.onChange({ ...field.value, address: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1}>
            <TextField
              label="City"
              size="small"
              value={field.value?.city || ''}
              onChange={(e) => field.onChange({ ...field.value, city: e.target.value })}
            />
            <TextField
              label="State"
              size="small"
              value={field.value?.state || ''}
              onChange={(e) => field.onChange({ ...field.value, state: e.target.value })}
            />
            <TextField
              label="Zip"
              size="small"
              value={field.value?.zip || ''}
              onChange={(e) => field.onChange({ ...field.value, zip: e.target.value })}
            />
          </Stack>
        </Box>
      )}
    </FieldWrapper>
  );
}
