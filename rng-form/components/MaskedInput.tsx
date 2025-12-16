'use client';

import { TextField } from '@mui/material';
import React from 'react';
import { IMaskInput } from 'react-imask';
import { MaskedTextItem } from '../types';
import { FieldWrapper } from './FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

const TextMaskCustom = React.forwardRef<HTMLInputElement, any>(function TextMaskCustom(props, ref) {
  const { onChange, mask, definitions, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask={mask}
      definitions={definitions}
      inputRef={ref}
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
          value={field.value || ''}
          fullWidth
          error={!!fieldState.error}
          // Fix: Ensure label is consistent with other fields
          hiddenLabel
          placeholder={mergedItem.placeholder}
          InputProps={{
            inputComponent: TextMaskCustom as any,
            inputProps: {
              mask: mergedItem.mask,
              definitions: mergedItem.definitions,
            },
          }}
        />
      )}
    </FieldWrapper>
  );
}
