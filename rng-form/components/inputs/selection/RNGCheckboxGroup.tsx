'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';

interface RNGCheckboxGroupProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'checkbox-group' };
}

export function RNGCheckboxGroup<S extends FormSchema>({ item }: RNGCheckboxGroupProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _fieldState, mergedItem) => {
        const value = (Array.isArray(field.value) ? field.value : []) as string[];

        const handleToggle = (optionValue: string | number | boolean, checked: boolean) => {
          const strValue = String(optionValue);
          if (checked) {
            field.onChange([...value, strValue]);
          } else {
            field.onChange(value.filter((v) => v !== strValue));
          }
        };

        return (
          <FormGroup row={mergedItem.row}>
            {mergedItem.options.map((option) => (
              <FormControlLabel
                key={String(option.value)}
                control={
                  <Checkbox
                    checked={value.includes(String(option.value))}
                    onChange={(e) => handleToggle(option.value, e.target.checked)}
                  />
                }
                label={option.label}
                disabled={mergedItem.disabled}
              />
            ))}
          </FormGroup>
        );
      }}
    </FieldWrapper>
  );
}
