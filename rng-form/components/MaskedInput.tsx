'use client';
import { TextField } from '@mui/material';
import React from 'react';
import { IMaskInput } from 'react-imask';
import { MaskedTextItem } from '../types';
import { FieldWrapper } from './FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Adapter for IMask to work with MUI
const TextMaskCustom = React.forwardRef<HTMLElement, any>(function TextMaskCustom(props, ref) {
  const { onChange, mask, definitions, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask={mask}
      definitions={definitions}
      inputRef={ref as any}
      onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

export function RNGMaskedInput({ item }: { item: MaskedTextItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          fullWidth
          error={!!fieldState.error}
          placeholder={mergedItem.placeholder}
          slotProps={{
            input: {
              inputComponent: TextMaskCustom as any,
              inputProps: {
                mask: mergedItem.mask,
                definitions: mergedItem.definitions,
              },
            },
          }}
        />
      )}
    </FieldWrapper>
  );
}
