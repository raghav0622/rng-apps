'use client';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { FormControlLabel, IconButton, InputAdornment, Switch, TextField } from '@mui/material';
import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { InputAttributes, NumericFormat, NumericFormatProps } from 'react-number-format';
import { FieldWrapper } from '../FieldWrapper';
import { FormSchema, NumberFieldItem, SwitchFieldItem, TextFieldItem } from '../types';

// --- Text Input ---
export function RNGTextInput<S extends FormSchema>({ item }: { item: TextFieldItem<S> }) {
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

interface CustomProps {
  onChange: (event: { target: { name: string; value: number | undefined } }) => void;
  name: string;
  inputRef: React.Ref<HTMLInputElement>;
}

const NumberFormatCustom = React.forwardRef<NumericFormatProps<InputAttributes>, CustomProps>(
  function NumberFormatCustom(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={props.inputRef}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.floatValue,
            },
          });
        }}
        thousandSeparator
        valueIsNumericString={false}
      />
    );
  },
);

export function RNGNumberInput<S extends FormSchema>({ item }: { item: NumberFieldItem<S> }) {
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
              // React.ComponentType<unknown> strictly matches MUI's expectation for a custom component
              inputComponent: NumberFormatCustom as unknown as React.ComponentType<unknown>,
              inputProps: {
                prefix: isCurrency ? '₹ ' : undefined,
                decimalScale: isCurrency ? 2 : undefined,
                name: field.name,
              },
            }}
          />
        )}
      />
    </FieldWrapper>
  );
}

// --- Switch ---
export function RNGSwitch<S extends FormSchema>({ item }: { item: SwitchFieldItem<S> }) {
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
