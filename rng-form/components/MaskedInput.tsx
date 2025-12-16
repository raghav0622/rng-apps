'use client';

import { TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { MaskedTextItem } from '../types';

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

interface RNGMaskedInputProps {
  item: MaskedTextItem<any>;
}

export function RNGMaskedInput({ item }: RNGMaskedInputProps) {
  const { control } = useFormContext();

  return (
    <Grid size={12} {...item.colProps}>
      <Controller
        name={item.name}
        control={control}
        render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
          <TextField
            fullWidth
            label={item.label}
            value={value || ''}
            onChange={onChange}
            inputRef={ref}
            error={!!error}
            helperText={error?.message || item.description}
            disabled={item.disabled}
            placeholder={item.placeholder}
            InputProps={{
              inputComponent: TextMaskCustom as any,
              inputProps: {
                mask: item.mask,
                definitions: item.definitions,
              },
            }}
          />
        )}
      />
    </Grid>
  );
}
