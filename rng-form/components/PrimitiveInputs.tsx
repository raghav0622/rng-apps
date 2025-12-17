'use client';

import { Box, InputAdornment, TextField } from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { ColorItem, HiddenFieldItem, NumberFieldItem, TextFieldItem } from '../types';
import { FieldWrapper } from './FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGTextInput({ item }: { item: TextFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          fullWidth
          id={field.name}
          type={mergedItem.type}
          placeholder={mergedItem.placeholder}
          multiline={mergedItem.multiline}
          rows={mergedItem.rows}
          error={!!fieldState.error}
          // If label is external, we can hide the internal legend label or keep it as placeholder
          label={!mergedItem.label ? undefined : undefined}
          variant="outlined"
        />
      )}
    </FieldWrapper>
  );
}

export function RNGHiddenInput({ item }: { item: HiddenFieldItem<any> }) {
  // Hidden inputs don't need the wrapper's UI overhead, just the registration
  const { name } = item;
  return (
    <FieldWrapper item={item} name={name}>
      {(field) => <input type="hidden" {...field} value={field.value ?? ''} />}
    </FieldWrapper>
  );
}

export function RNGNumberInput({ item }: { item: NumberFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => {
        // Use react-number-format for robust number/currency handling
        return (
          <NumericFormat
            customInput={TextField}
            {...field}
            value={field.value ?? ''}
            fullWidth
            id={field.name}
            placeholder={mergedItem.placeholder}
            decimalScale={mergedItem.type === 'currency' ? 2 : undefined}
            fixedDecimalScale={mergedItem.type === 'currency'}
            allowNegative={mergedItem.min === undefined || mergedItem.min < 0}
            min={mergedItem.min}
            max={mergedItem.max}
            thousandSeparator={mergedItem.type === 'currency' ? ',' : undefined}
            prefix={mergedItem.type === 'currency' ? '₹' : undefined}
            onValueChange={(values) => {
              // Store as number or null if empty
              const floatVal = values.floatValue;
              field.onChange(floatVal === undefined ? '' : floatVal);
            }}
            error={!!fieldState.error}
          />
        );
      }}
    </FieldWrapper>
  );
}

export function RNGColorInput({ item }: { item: ColorItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            {...field}
            value={field.value ?? '#000000'}
            fullWidth
            error={!!fieldState.error}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <input
                      type="color"
                      value={field.value ?? '#000000'}
                      onChange={(e) => field.onChange(e.target.value)}
                      style={{
                        width: 32,
                        height: 32,
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                      }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      )}
    </FieldWrapper>
  );
}
