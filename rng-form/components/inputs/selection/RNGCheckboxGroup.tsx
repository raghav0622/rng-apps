'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { CheckboxGroupItem } from '@/rng-form/types';
import { Checkbox, FormControlLabel, FormGroup, FormLabel } from '@mui/material';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RNGCheckboxGroup({ item }: { item: CheckboxGroupItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => {
        const handleToggle = (optionValue: string | number | boolean) => {
          const currentValues = Array.isArray(field.value) ? field.value : [];

          const newValues = currentValues.includes(optionValue)
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              currentValues.filter((v: any) => v !== optionValue)
            : [...currentValues, optionValue];
          field.onChange(newValues);
        };

        return (
          <>
            <FormLabel component="legend" sx={{ fontWeight: 500, mb: 1 }}>
              {mergedItem.label}
            </FormLabel>
            <FormGroup row={mergedItem.row}>
              {mergedItem.options.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  control={
                    <Checkbox
                      checked={Array.isArray(field.value) && field.value.includes(opt.value)}
                      onChange={() => handleToggle(opt.value)}
                    />
                  }
                  label={opt.label}
                />
              ))}
            </FormGroup>
          </>
        );
      }}
    </FieldWrapper>
  );
}
