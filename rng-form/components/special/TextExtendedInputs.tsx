'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Stack, TextField } from '@mui/material';
import React from 'react';
import { IMaskInput } from 'react-imask';

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
  pathPrefix?: string; // ✅ Added support for scoped paths
}

export function RNGMaskedInput<S extends FormSchema>({ item, pathPrefix }: RNGMaskedInputProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, fieldState, mergedItem) => {
        // 🛡️ Safe property access
        const mask = 'mask' in mergedItem ? (mergedItem as any).mask : '';
        const definitions =
          'definitions' in mergedItem ? (mergedItem as any).definitions : undefined;

        return (
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
                  mask: mask,
                  definitions: definitions,
                },
              },
            }}
          />
        );
      }}
    </FieldWrapper>
  );
}

// --- OTP INPUT ---
interface RNGOtpInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'otp' };
  pathPrefix?: string; // ✅ Added support for scoped paths
}

export function RNGOtpInput<S extends FormSchema>({ item, pathPrefix }: RNGOtpInputProps<S>) {
  // Safe default length
  const length = (item as any).length || 6;

  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
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
