'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';

interface RNGCheckboxGroupProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'checkbox-group' };
  pathPrefix?: string; // ✅ Added to support nested forms
}

export function RNGCheckboxGroup<S extends FormSchema>({
  item,
  pathPrefix,
}: RNGCheckboxGroupProps<S>) {
  const {
    options,
    getOptionLabel = (opt: any) => (typeof opt === 'string' ? opt : opt.label || String(opt)),
    getOptionValue = (opt: any) =>
      typeof opt === 'string' ? opt : opt.value !== undefined ? opt.value : opt,
  } = item;

  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, _fieldState, mergedItem) => {
        // 🛡️ Safe check for 'row' property
        const isRow = 'row' in mergedItem ? (mergedItem as any).row : false;

        const value = (Array.isArray(field.value) ? field.value : []) as any[];

        const handleToggle = (optionValue: any, checked: boolean) => {
          if (checked) {
            field.onChange([...value, optionValue]);
          } else {
            field.onChange(value.filter((v) => v !== optionValue));
          }
        };

        return (
          <FormGroup row={isRow}>
            {options.map((option, index) => {
              const label = getOptionLabel(option);
              const optValue = getOptionValue(option);
              const isChecked = value.includes(optValue);

              return (
                <FormControlLabel
                  key={`${item.name}-checkbox-${index}`}
                  control={
                    <Checkbox
                      checked={isChecked}
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
