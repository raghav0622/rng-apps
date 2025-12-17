'use client';

import { InputAdornment, TextField } from '@mui/material';
import { NumberFieldItem, TextFieldItem } from '../types';
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
          hiddenLabel // Handled by FieldWrapper
          variant="outlined"
          slotProps={{
            htmlInput: {
              'aria-describedby': fieldState.error ? `${field.name}-error` : undefined,
            },
          }}
        />
      )}
    </FieldWrapper>
  );
}

export function RNGNumberInput({ item }: { item: NumberFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
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
          error={!!fieldState.error}
          hiddenLabel
          slotProps={{
            input: {
              startAdornment:
                mergedItem.type === 'currency' ? (
                  <InputAdornment position="start">₹</InputAdornment>
                ) : null,
            },
            htmlInput: {
              'aria-describedby': fieldState.error ? `${field.name}-error` : undefined,
            },
          }}
        />
      )}
    </FieldWrapper>
  );
}
