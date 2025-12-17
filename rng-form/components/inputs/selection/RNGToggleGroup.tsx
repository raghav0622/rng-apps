'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { ToggleGroupItem } from '@/rng-form/types';
import { Box, FormLabel, ToggleButton, ToggleButtonGroup } from '@mui/material';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RNGToggleGroup({ item }: { item: ToggleGroupItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Box>
          <FormLabel component="legend" sx={{ fontWeight: 500, mb: 1 }}>
            {mergedItem.label}
          </FormLabel>
          <ToggleButtonGroup
            value={field.value}
            exclusive={mergedItem.exclusive}
            onChange={(_, newVal) => field.onChange(newVal)}
            aria-label={mergedItem.label}
            fullWidth
          >
            {mergedItem.options.map((opt) => (
              <ToggleButton key={opt.value.toString()} value={opt.value}>
                {opt.icon && <Box sx={{ mr: 1, display: 'flex' }}>{opt.icon}</Box>}
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}
    </FieldWrapper>
  );
}
