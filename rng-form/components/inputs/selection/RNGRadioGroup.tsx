'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { RadioGroupItem } from '@/rng-form/types';
import { FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RNGRadioGroup({ item }: { item: RadioGroupItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <>
          <FormLabel component="legend" sx={{ fontWeight: 500, mb: 1 }}>
            {mergedItem.label}
          </FormLabel>
          <RadioGroup {...field} value={field.value ?? ''} row={mergedItem.row}>
            {mergedItem.options.map((opt) => (
              <FormControlLabel
                key={opt.value.toString()}
                value={opt.value}
                control={<Radio />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
        </>
      )}
    </FieldWrapper>
  );
}
