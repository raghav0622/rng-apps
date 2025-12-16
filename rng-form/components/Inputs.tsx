'use client';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
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
import { useRNGForm } from '../FormContext';
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

// --- Helper: Read-Only Display ---
const ReadOnlyValue = ({ label, value }: { label?: string; value: React.ReactNode }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={500} sx={{ minHeight: '1.5em' }}>
      {value ?? '-'}
    </Typography>
  </Box>
);

// --- Text Input ---
export function RNGTextInput<S extends FormSchema>({ item }: { item: TextFieldItem<S> }) {
  const { control } = useFormContext();
  const { readOnly } = useRNGForm();
  const [showPass, setShowPass] = useState(false);
  const isPass = item.type === 'password';

  if (readOnly) {
    return (
      <FieldWrapper item={item}>
        <Controller
          name={item.name}
          control={control}
          render={({ field }) => (
            <ReadOnlyValue
              label={item.label}
              value={isPass && field.value ? '********' : field.value}
            />
          )}
        />
      </FieldWrapper>
    );
  }

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
  // We keep name as string here to match HTML standards
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
  const { readOnly } = useRNGForm();
  const isCurrency = item.type === 'currency';

  if (readOnly) {
    return (
      <FieldWrapper item={item}>
        <Controller
          name={item.name}
          control={control}
          render={({ field }) => {
            let displayVal = field.value;
            if (isCurrency && typeof field.value === 'number') {
              displayVal = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(field.value);
            }
            return <ReadOnlyValue label={item.label} value={displayVal} />;
          }}
        />
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper item={item}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            // FIX: Explicitly cast the event to 'any' to resolve the type mismatch.
            // MUI/NumberFormatCustom provides `name: string`, but RHF expects `name: Path<S>`.
            // Since we pass `field.name` to inputProps below, we know the name is correct.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e) => field.onChange(e as any)}
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
  const { readOnly } = useRNGForm();

  if (readOnly) {
    return (
      <FieldWrapper item={item}>
        <Controller
          name={item.name}
          control={control}
          render={({ field }) => (
            <ReadOnlyValue label={item.label} value={field.value ? 'Yes' : 'No'} />
          )}
        />
      </FieldWrapper>
    );
  }

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
  const { readOnly } = useRNGForm();

  if (readOnly) {
    return (
      <FieldWrapper item={item}>
        <Controller
          name={item.name}
          control={control}
          render={({ field }) => <ReadOnlyValue label={item.label} value={field.value} />}
        />
      </FieldWrapper>
    );
  }

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
  const { readOnly } = useRNGForm();

  if (readOnly) {
    return (
      <FieldWrapper item={item}>
        <Controller
          name={item.name}
          control={control}
          render={({ field }) => {
            const selectedOption = item.options.find((opt) => opt.value === field.value);
            return (
              <ReadOnlyValue
                label={item.label}
                value={selectedOption ? selectedOption.label : field.value}
              />
            );
          }}
        />
      </FieldWrapper>
    );
  }

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
  const { readOnly } = useRNGForm();

  if (readOnly) {
    return (
      <FieldWrapper item={item}>
        <Typography component="legend" variant="caption" color="text.secondary">
          {item.label}
        </Typography>
        <Controller
          name={item.name}
          control={control}
          render={({ field }) => (
            <Box sx={{ mt: 0.5, mb: 2 }}>
              <Rating
                value={Number(field.value) || 0}
                readOnly
                max={item.max}
                precision={item.precision}
              />
            </Box>
          )}
        />
      </FieldWrapper>
    );
  }

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
  const { readOnly } = useRNGForm();

  if (readOnly) {
    return (
      <FieldWrapper item={item}>
        <Controller
          name={item.name}
          control={control}
          render={({ field }) => {
            const selectedValues = (field.value as unknown[]) || [];
            // Map values to labels
            const labels = item.options
              .filter((opt) => selectedValues.includes(opt.value))
              .map((opt) => opt.label)
              .join(', ');

            return <ReadOnlyValue label={item.label} value={labels || 'None'} />;
          }}
        />
      </FieldWrapper>
    );
  }

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
