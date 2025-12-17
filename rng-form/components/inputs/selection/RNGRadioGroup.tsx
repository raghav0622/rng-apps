'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';

interface RNGRadioGroupProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'radio' };
}

export function RNGRadioGroup<S extends FormSchema>({ item }: RNGRadioGroupProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _fieldState, mergedItem) => (
        <RadioGroup {...field} row={mergedItem.row}>
          {mergedItem.options.map((option) => (
            <FormControlLabel
              key={String(option.value)}
              value={option.value}
              control={<Radio />}
              label={option.label}
              disabled={mergedItem.disabled}
            />
          ))}
        </RadioGroup>
      )}
    </FieldWrapper>
  );
}
