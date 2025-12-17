'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { FormControlLabel, Switch } from '@mui/material';

interface RNGSwitchProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'switch' };
}

export function RNGSwitch<S extends FormSchema>({ item }: RNGSwitchProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _fieldState, mergedItem) => (
        <FormControlLabel
          control={
            <Switch
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              disabled={mergedItem.disabled}
            />
          }
          label={mergedItem.label || ''}
        />
      )}
    </FieldWrapper>
  );
}
