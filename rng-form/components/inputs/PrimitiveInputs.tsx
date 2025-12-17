'use client';

import { ButtonBase, InputAdornment, TextField } from '@mui/material';
import { useRef } from 'react';
import { NumericFormat } from 'react-number-format';
import { ColorItem, HiddenFieldItem, NumberFieldItem, TextFieldItem } from '../../types';
import { FieldWrapper } from '../FieldWrapper';

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
          // If label is external, we can hide the internal legend label
          label={!mergedItem.label ? undefined : undefined}
          variant="outlined"
        />
      )}
    </FieldWrapper>
  );
}

export function RNGHiddenInput({ item }: { item: HiddenFieldItem<any> }) {
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
      {(field, fieldState, mergedItem) => (
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
            const floatVal = values.floatValue;
            field.onChange(floatVal === undefined ? '' : floatVal);
          }}
          error={!!fieldState.error}
        />
      )}
    </FieldWrapper>
  );
}

export function RNGColorInput({ item }: { item: ColorItem<any> }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState) => (
        <TextField
          {...field}
          value={field.value ?? '#000000'}
          fullWidth
          error={!!fieldState.error}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {/* Keyboard Accessible Color Trigger */}
                  <ButtonBase
                    onClick={() => inputRef.current?.click()}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      backgroundColor: field.value ?? '#000000',
                      border: '1px solid #ccc',
                    }}
                    aria-label="Pick color"
                  >
                    <input
                      ref={inputRef}
                      type="color"
                      value={field.value ?? '#000000'}
                      onChange={(e) => field.onChange(e.target.value)}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                        left: 0,
                        top: 0,
                      }}
                      tabIndex={-1} // Triggered by ButtonBase via click
                    />
                  </ButtonBase>
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    </FieldWrapper>
  );
}
