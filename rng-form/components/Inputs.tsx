'use client';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  Rating,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { InputAttributes, NumericFormat, NumericFormatProps } from 'react-number-format';
import { FieldWrapper } from '../FieldWrapper';
import {
  CheckboxGroupItem,
  FormSchema,
  NumberFieldItem,
  RadioGroupItem,
  RatingItem,
  SliderItem,
  SwitchFieldItem,
  TextFieldItem,
} from '../types';

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

// --- Slider ---
export function RNGSlider<S extends FormSchema>({ item }: { item: SliderItem<S> }) {
  const { control } = useFormContext();
  return (
    <FieldWrapper item={item}>
      <Typography gutterBottom>{item.label}</Typography>
      <Controller
        name={item.name}
        control={control}
        render={({ field }) => (
          <Slider
            value={typeof field.value === 'number' ? field.value : 0}
            onChange={(_, value) => field.onChange(value)}
            valueLabelDisplay="auto"
            min={item.min}
            max={item.max}
            step={item.step}
            disabled={item.disabled}
          />
        )}
      />
      {item.description && (
        <Typography variant="caption" color="text.secondary">
          {item.description}
        </Typography>
      )}
    </FieldWrapper>
  );
}

// --- Radio Group ---
export function RNGRadioGroup<S extends FormSchema>({ item }: { item: RadioGroupItem<S> }) {
  const { control } = useFormContext();
  return (
    <FieldWrapper item={item}>
      <FormControl component="fieldset" disabled={item.disabled}>
        <FormLabel component="legend">{item.label}</FormLabel>
        <Controller
          name={item.name}
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} row={item.row}>
              {item.options.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  value={opt.value}
                  control={<Radio />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          )}
        />
        {item.description && <FormHelperText>{item.description}</FormHelperText>}
      </FormControl>
    </FieldWrapper>
  );
}

// --- Rating ---
export function RNGRating<S extends FormSchema>({ item }: { item: RatingItem<S> }) {
  const { control } = useFormContext();
  return (
    <FieldWrapper item={item}>
      <Typography component="legend" gutterBottom>
        {item.label}
      </Typography>
      <Controller
        name={item.name}
        control={control}
        render={({ field }) => (
          <Rating
            name={field.name}
            value={Number(field.value) || 0}
            onChange={(_, newValue) => field.onChange(newValue)}
            max={item.max}
            precision={item.precision}
            disabled={item.disabled}
          />
        )}
      />
      {item.description && <FormHelperText>{item.description}</FormHelperText>}
    </FieldWrapper>
  );
}

// --- Checkbox Group (Multi Select) ---
export function RNGCheckboxGroup<S extends FormSchema>({ item }: { item: CheckboxGroupItem<S> }) {
  const { control } = useFormContext();
  return (
    <FieldWrapper item={item}>
      <FormControl component="fieldset" disabled={item.disabled}>
        <FormLabel component="legend">{item.label}</FormLabel>
        <Controller
          name={item.name}
          control={control}
          render={({ field }) => {
            const selected = (field.value as unknown[]) || [];
            const handleChange = (value: string | number | boolean, checked: boolean) => {
              if (checked) {
                field.onChange([...selected, value]);
              } else {
                field.onChange(selected.filter((v) => v !== value));
              }
            };

            return (
              <FormGroup row={item.row}>
                {item.options.map((opt) => (
                  <FormControlLabel
                    key={opt.value.toString()}
                    control={
                      <Checkbox
                        checked={selected.includes(opt.value)}
                        onChange={(e) => handleChange(opt.value, e.target.checked)}
                      />
                    }
                    label={opt.label}
                  />
                ))}
              </FormGroup>
            );
          }}
        />
      </FormControl>
    </FieldWrapper>
  );
}
