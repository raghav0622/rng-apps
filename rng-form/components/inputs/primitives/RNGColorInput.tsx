'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { ColorItem } from '@/rng-form/types';
import { ButtonBase, InputAdornment, TextField } from '@mui/material';
import { useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                      tabIndex={-1}
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
