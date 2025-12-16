'use client';

import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Rating, // Kept if you plan to add Select later, though not used in current mapping
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Controller, useFormContext } from 'react-hook-form';
import {
  CheckboxGroupItem,
  NumberFieldItem,
  RadioGroupItem,
  RatingItem,
  SliderItem,
  SwitchFieldItem,
  TextFieldItem,
} from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// --- Text Input ---
export function RNGTextInput({ item }: { item: TextFieldItem<any> }) {
  const { control } = useFormContext();
  return (
    <Grid size={12} {...item.colProps}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            // FIX: Default to empty string to prevent label overlap
            value={field.value ?? ''}
            fullWidth
            label={item.label}
            type={item.type}
            error={!!error}
            helperText={error?.message || item.description}
            disabled={item.disabled}
            placeholder={item.placeholder}
          />
        )}
      />
    </Grid>
  );
}

// --- Number Input ---
export function RNGNumberInput({ item }: { item: NumberFieldItem<any> }) {
  const { control } = useFormContext();
  return (
    <Grid size={12} {...item.colProps}>
      <Controller
        name={item.name}
        control={control}
        render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
          <TextField
            {...field}
            // FIX: Default to empty string
            value={value ?? ''}
            fullWidth
            label={item.label}
            type="number"
            onChange={(e) => {
              const val = e.target.value;
              onChange(val === '' ? '' : Number(val));
            }}
            error={!!error}
            helperText={error?.message || item.description}
            disabled={item.disabled}
            slotProps={{
              input: {
                startAdornment: item.type === 'currency' ? '$' : undefined,
              },
            }}
          />
        )}
      />
    </Grid>
  );
}

// --- Switch ---
export function RNGSwitch({ item }: { item: SwitchFieldItem<any> }) {
  const { control } = useFormContext();
  return (
    <Grid size={12} {...item.colProps}>
      <Controller
        name={item.name}
        control={control}
        render={({ field: { value, onChange, ...field }, fieldState: { error } }) => (
          <FormControl component="fieldset" error={!!error}>
            <FormControlLabel
              control={
                <Switch
                  {...field}
                  checked={!!value} // Switch uses 'checked', not 'value'
                  onChange={(e) => onChange(e.target.checked)}
                />
              }
              label={item.label}
              disabled={item.disabled}
            />
            {(error || item.description) && (
              <FormHelperText>{error?.message || item.description}</FormHelperText>
            )}
          </FormControl>
        )}
      />
    </Grid>
  );
}

// --- Radio Group ---
export function RNGRadioGroup({ item }: { item: RadioGroupItem<any> }) {
  const { control } = useFormContext();
  return (
    <Grid size={12} {...item.colProps}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormControl component="fieldset" error={!!error} disabled={item.disabled}>
            <FormLabel component="legend">{item.label}</FormLabel>
            <RadioGroup {...field} value={field.value ?? ''} row={item.row}>
              {item.options.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  value={opt.value}
                  control={<Radio />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
            {(error || item.description) && (
              <FormHelperText>{error?.message || item.description}</FormHelperText>
            )}
          </FormControl>
        )}
      />
    </Grid>
  );
}

// --- Checkbox Group ---
export function RNGCheckboxGroup({ item }: { item: CheckboxGroupItem<any> }) {
  const { control } = useFormContext();
  return (
    <Grid size={12} {...item.colProps}>
      <Controller
        name={item.name}
        control={control}
        render={({ field: { value = [], onChange }, fieldState: { error } }) => {
          const handleToggle = (optionValue: string | number | boolean) => {
            const currentValues = Array.isArray(value) ? value : [];
            const newValues = currentValues.includes(optionValue)
              ? currentValues.filter((v: any) => v !== optionValue)
              : [...currentValues, optionValue];
            onChange(newValues);
          };

          return (
            <FormControl component="fieldset" error={!!error} disabled={item.disabled}>
              <FormLabel component="legend">{item.label}</FormLabel>
              <FormGroup row={item.row}>
                {item.options.map((opt) => (
                  <FormControlLabel
                    key={opt.value.toString()}
                    control={
                      <Checkbox
                        checked={Array.isArray(value) && value.includes(opt.value)}
                        onChange={() => handleToggle(opt.value)}
                      />
                    }
                    label={opt.label}
                  />
                ))}
              </FormGroup>
              {(error || item.description) && (
                <FormHelperText>{error?.message || item.description}</FormHelperText>
              )}
            </FormControl>
          );
        }}
      />
    </Grid>
  );
}

// --- Slider ---
export function RNGSlider({ item }: { item: SliderItem<any> }) {
  const { control } = useFormContext();
  return (
    <Grid size={12} {...item.colProps}>
      <Controller
        name={item.name}
        control={control}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <Box sx={{ width: '100%', px: 1 }}>
            <Typography gutterBottom>{item.label}</Typography>
            <Slider
              value={typeof value === 'number' ? value : item.min || 0}
              onChange={(_, val) => onChange(val)}
              min={item.min}
              max={item.max}
              step={item.step}
              valueLabelDisplay="auto"
              disabled={item.disabled}
            />
            {(error || item.description) && (
              <Typography variant="caption" color={error ? 'error' : 'textSecondary'}>
                {error?.message || item.description}
              </Typography>
            )}
          </Box>
        )}
      />
    </Grid>
  );
}

// --- Rating ---
export function RNGRating({ item }: { item: RatingItem<any> }) {
  const { control } = useFormContext();
  return (
    <Grid size={12} {...item.colProps}>
      <Controller
        name={item.name}
        control={control}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <Box display="flex" flexDirection="column">
            <Typography component="legend">{item.label}</Typography>
            <Rating
              value={Number(value) || 0}
              onChange={(_, val) => onChange(val)}
              max={item.max}
              precision={item.precision}
              disabled={item.disabled}
            />
            {(error || item.description) && (
              <Typography variant="caption" color={error ? 'error' : 'textSecondary'}>
                {error?.message || item.description}
              </Typography>
            )}
          </Box>
        )}
      />
    </Grid>
  );
}
