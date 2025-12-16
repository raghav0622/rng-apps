'use client';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { FormControlLabel, IconButton, InputAdornment, Switch, TextField } from '@mui/material';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { FieldWrapper } from '../FieldWrapper';
import { NumberFieldItem, SwitchFieldItem, TextFieldItem } from '../types';

// --- Text Input ---
export function RNGTextInput({ item }: { item: TextFieldItem<any> }) {
  const { control } = useFormContext();
  const [showPass, setShowPass] = useState(false);
  const isPass = item.type === 'password';

  return (
    <FieldWrapper item={item}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            fullWidth
            label={item.label}
            type={isPass && !showPass ? 'password' : 'text'}
            error={!!error}
            helperText={error?.message || item.description}
            disabled={item.disabled}
            InputProps={{
              endAdornment: isPass && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass(!showPass)} edge="end">
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      />
    </FieldWrapper>
  );
}

// --- Number/Currency Input ---
// Requires: npm install react-number-format
const NumberFormatCustom = (props: any) => {
  const { inputRef, onChange, ...other } = props;
  return (
    <NumericFormat
      {...other}
      getInputRef={inputRef}
      onValueChange={(values) => {
        onChange({ target: { name: props.name, value: values.floatValue } });
      }}
      thousandSeparator
      valueIsNumericString={false}
    />
  );
};

export function RNGNumberInput({ item }: { item: NumberFieldItem<any> }) {
  const { control } = useFormContext();
  const isCurrency = item.type === 'currency';

  return (
    <FieldWrapper item={item}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            fullWidth
            label={item.label}
            error={!!error}
            helperText={error?.message || item.description}
            disabled={item.disabled}
            InputProps={{
              inputComponent: NumberFormatCustom as any,
              inputProps: {
                prefix: isCurrency ? '₹ ' : undefined,
                decimalScale: isCurrency ? 2 : undefined,
              },
            }}
          />
        )}
      />
    </FieldWrapper>
  );
}

// --- Switch ---
export function RNGSwitch({ item }: { item: SwitchFieldItem<any> }) {
  const { control } = useFormContext();
  return (
    <FieldWrapper item={item}>
      <Controller
        name={item.name}
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Switch checked={!!field.value} onChange={field.onChange} />}
            label={item.label}
            disabled={item.disabled}
          />
        )}
      />
    </FieldWrapper>
  );
}
