'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';

interface RNGCheckboxGroupProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'checkbox-group' };
}

export function RNGCheckboxGroup<S extends FormSchema>({ item }: RNGCheckboxGroupProps<S>) {
  const {
    options,
    getOptionLabel = (opt: any) => (typeof opt === 'string' ? opt : opt.label || String(opt)),
    getOptionValue = (opt: any) => (typeof opt === 'string' ? opt : opt.value !== undefined ? opt.value : opt),
  } = item;

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _fieldState, mergedItem) => {
        const value = (Array.isArray(field.value) ? field.value : []) as any[];

        const handleToggle = (optionValue: any, checked: boolean) => {
          if (checked) {
            field.onChange([...value, optionValue]);
          } else {
            // Note: Simple equality check for removal. 
            // In case of objects, users should provide primitive values or we'd need isOptionEqualToValue.
            field.onChange(value.filter((v) => v !== optionValue));
          }
        };

        return (
          <FormGroup row={mergedItem.row}>
            {options.map((option, index) => {
              const label = getOptionLabel(option);
              const optValue = getOptionValue(option);
              
              return (
                <FormControlLabel
                  key={`${item.name}-checkbox-${index}`}
                  control={
                    <Checkbox
                      checked={value.includes(optValue)}
                      onChange={(e) => handleToggle(optValue, e.target.checked)}
                    />
                  }
                  label={label}
                  disabled={mergedItem.disabled}
                />
              );
            })}
          </FormGroup>
        );
      }}
    </FieldWrapper>
  );
}
