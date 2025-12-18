'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

interface RNGToggleGroupProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'toggle-group' };
}

export function RNGToggleGroup<S extends FormSchema>({ item }: RNGToggleGroupProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _fieldState, mergedItem) => (
        <ToggleButtonGroup
          value={field.value}
          exclusive={mergedItem.exclusive}
          onChange={(_e, newVal) => field.onChange(newVal)}
          aria-label={mergedItem.label}
          fullWidth
          disabled={mergedItem.disabled}
        >
          {mergedItem.options.map((option) => (
            <ToggleButton key={String(option.value)} value={option.value}>
              {option.icon}
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
    </FieldWrapper>
  );
}
