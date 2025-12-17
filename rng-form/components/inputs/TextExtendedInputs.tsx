'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Stack, TextField } from '@mui/material';
import React from 'react';
import { IMaskInput } from 'react-imask';

/* eslint-disable @typescript-eslint/no-explicit-any */

// --- MASKED INPUT ---
const TextMaskCustom = React.forwardRef<HTMLElement, any>(function TextMaskCustom(props, ref) {
  const { onChange, mask, definitions, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask={mask}
      definitions={definitions}
      inputRef={ref as any}
      onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

interface RNGMaskedInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'masked-text' };
}

export function RNGMaskedInput<S extends FormSchema>({ item }: RNGMaskedInputProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          fullWidth
          error={!!fieldState.error}
          placeholder={mergedItem.placeholder}
          slotProps={{
            input: {
              inputComponent: TextMaskCustom as any,
              inputProps: {
                mask: mergedItem.mask,
                definitions: mergedItem.definitions,
              },
            },
          }}
        />
      )}
    </FieldWrapper>
  );
}

// --- OTP INPUT ---
interface RNGOtpInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'otp' };
}

export function RNGOtpInput<S extends FormSchema>({ item }: RNGOtpInputProps<S>) {
  const length = item.length || 6;

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field) => {
        const handleChange = (index: number, val: string) => {
          if (!/^\d*$/.test(val)) return;
          const current = (field.value || '').padEnd(length, ' ').split('');
          current[index] = val;
          const newValue = current.join('').trim();
          field.onChange(newValue);

          // Auto-focus next
          if (val && index < length - 1) {
            const nextInput = document.getElementById(`${item.name}-otp-${index + 1}`);
            nextInput?.focus();
          }
        };

        const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
          if (e.key === 'Backspace' && !(field.value || '')[index] && index > 0) {
            const prevInput = document.getElementById(`${item.name}-otp-${index - 1}`);
            prevInput?.focus();
          }
        };

        return (
          <Stack direction="row" spacing={1}>
            {Array.from({ length }).map((_, i) => (
              <TextField
                key={i}
                id={`${item.name}-otp-${i}`}
                value={(field.value || '')[i] || ''}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                inputProps={{
                  maxLength: 1,
                  style: { textAlign: 'center', width: '1ch' },
                }}
              />
            ))}
          </Stack>
        );
      }}
    </FieldWrapper>
  );
}
