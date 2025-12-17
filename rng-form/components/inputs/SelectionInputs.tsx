'use client';

import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { CheckboxGroupItem, RadioGroupItem, SwitchFieldItem, ToggleGroupItem } from '../../types';
import { FieldWrapper } from '../FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

export function RNGRadioGroup({ item }: { item: RadioGroupItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <>
          <FormLabel component="legend" sx={{ fontWeight: 500, mb: 1 }}>
            {mergedItem.label}
          </FormLabel>
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
            <FormLabel component="legend" sx={{ fontWeight: 500, mb: 1 }}>
              {mergedItem.label}
            </FormLabel>
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

export function RNGToggleGroup({ item }: { item: ToggleGroupItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Box>
          <FormLabel component="legend" sx={{ fontWeight: 500, mb: 1 }}>
            {mergedItem.label}
          </FormLabel>
          <ToggleButtonGroup
            value={field.value}
            exclusive={mergedItem.exclusive}
            onChange={(_, newVal) => field.onChange(newVal)}
            aria-label={mergedItem.label}
            fullWidth
          >
            {mergedItem.options.map((opt) => (
              <ToggleButton key={opt.value.toString()} value={opt.value}>
                {opt.icon && <Box sx={{ mr: 1, display: 'flex' }}>{opt.icon}</Box>}
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}
    </FieldWrapper>
  );
}
