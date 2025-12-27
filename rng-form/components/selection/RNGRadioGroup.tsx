'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';

interface RNGRadioGroupProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'radio' };
}

export function RNGRadioGroup<S extends FormSchema>({ item }: RNGRadioGroupProps<S>) {
  const {
    options,
    getOptionLabel = (opt: any) => (typeof opt === 'string' ? opt : opt.label || String(opt)),
    getOptionValue = (opt: any) =>
      typeof opt === 'string' ? opt : opt.value !== undefined ? opt.value : opt,
  } = item;

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _fieldState, mergedItem) => (
        <RadioGroup {...field} row={mergedItem.row} name={field.name} value={field.value ?? ''}>
          {options.map((option, index) => {
            const label = getOptionLabel(option);
            const value = getOptionValue(option);

            return (
              <FormControlLabel
                key={`${item.name}-radio-${index}`}
                value={value}
                control={<Radio />}
                label={label}
                disabled={mergedItem.disabled}
              />
            );
          })}
        </RadioGroup>
      )}
    </FieldWrapper>
  );
}
