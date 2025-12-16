'use client';

import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Rating,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckboxGroupItem,
  NumberFieldItem,
  RadioGroupItem,
  RatingItem,
  SliderItem,
  SwitchFieldItem,
  TextFieldItem,
} from '../types';
import { FieldWrapper } from './FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

// --- Text Input ---
export function RNGTextInput({ item }: { item: TextFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          fullWidth
          id={field.name}
          type={mergedItem.type}
          placeholder={mergedItem.placeholder}
          multiline={mergedItem.multiline}
          rows={mergedItem.rows}
          error={!!_.error} // Pass error state to input styling
          // Note: Label is handled by FieldWrapper or hidden here to avoid duplication
          hiddenLabel // We use the FieldWrapper label
          variant="outlined"
        />
      )}
    </FieldWrapper>
  );
}

// --- Number Input ---
export function RNGNumberInput({ item }: { item: NumberFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          fullWidth
          id={field.name}
          type="number"
          placeholder={mergedItem.placeholder}
          onChange={(e) => {
            const val = e.target.value;
            field.onChange(val === '' ? '' : Number(val));
          }}
          error={!!_.error}
          hiddenLabel
          slotProps={{
            input: {
              startAdornment:
                mergedItem.type === 'currency' ? (
                  <InputAdornment position="start">₹</InputAdornment>
                ) : null,
            },
          }}
        />
      )}
    </FieldWrapper>
  );
}

// --- Switch ---
export function RNGSwitch({ item }: { item: SwitchFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <FormControlLabel
          control={
            <Switch
              {...field}
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          }
          label={mergedItem.label}
        />
      )}
    </FieldWrapper>
  );
}

// --- Radio Group ---
export function RNGRadioGroup({ item }: { item: RadioGroupItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <>
          <FormLabel component="legend">{mergedItem.label}</FormLabel>
          <RadioGroup {...field} value={field.value ?? ''} row={mergedItem.row}>
            {mergedItem.options.map((opt) => (
              <FormControlLabel
                key={opt.value.toString()}
                value={opt.value}
                control={<Radio />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
        </>
      )}
    </FieldWrapper>
  );
}

// --- Checkbox Group ---
export function RNGCheckboxGroup({ item }: { item: CheckboxGroupItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => {
        const handleToggle = (optionValue: string | number | boolean) => {
          const currentValues = Array.isArray(field.value) ? field.value : [];
          const newValues = currentValues.includes(optionValue)
            ? currentValues.filter((v: any) => v !== optionValue)
            : [...currentValues, optionValue];
          field.onChange(newValues);
        };

        return (
          <>
            <FormLabel component="legend">{mergedItem.label}</FormLabel>
            <FormGroup row={mergedItem.row}>
              {mergedItem.options.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  control={
                    <Checkbox
                      checked={Array.isArray(field.value) && field.value.includes(opt.value)}
                      onChange={() => handleToggle(opt.value)}
                    />
                  }
                  label={opt.label}
                />
              ))}
            </FormGroup>
          </>
        );
      }}
    </FieldWrapper>
  );
}

// --- Slider ---
export function RNGSlider({ item }: { item: SliderItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Box sx={{ width: '100%', px: 1, mt: 1 }}>
          <Typography gutterBottom>{mergedItem.label}</Typography>
          <Slider
            value={typeof field.value === 'number' ? field.value : mergedItem.min || 0}
            onChange={(_, val) => field.onChange(val)}
            min={mergedItem.min}
            max={mergedItem.max}
            step={mergedItem.step}
            valueLabelDisplay="auto"
          />
        </Box>
      )}
    </FieldWrapper>
  );
}

// --- Rating ---
export function RNGRating({ item }: { item: RatingItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Box display="flex" flexDirection="column">
          <Typography component="legend">{mergedItem.label}</Typography>
          <Rating
            value={Number(field.value) || 0}
            onChange={(_, val) => field.onChange(val)}
            max={mergedItem.max}
            precision={mergedItem.precision}
          />
        </Box>
      )}
    </FieldWrapper>
  );
}
