'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { SwitchFieldItem } from '@/rng-form/types';
import { FormControlLabel, Switch } from '@mui/material';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RNGSwitch({ item }: { item: SwitchFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <FormControlLabel
          control={
            <Switch
              {...field}
              // Switch needs 'checked', not value
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              inputProps={{
                'aria-label': mergedItem.label,
              }}
            />
          }
          label={mergedItem.label}
        />
      )}
    </FieldWrapper>
  );
}
