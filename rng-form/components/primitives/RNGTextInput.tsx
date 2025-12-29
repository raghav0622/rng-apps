'use client';

import { TextField } from '@mui/material';
import React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { InputItem } from '../../types';

interface RNGTextInputProps {
  item: InputItem<any>;
}

export const RNGTextInput: React.FC<RNGTextInputProps> = ({ item }) => {
  const { control } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({
    name: item.name!,
    control,
    rules: { required: item.required ? 'This field is required' : false },
  });

  return (
    <TextField
      {...field}
      // 🚫 REMOVED: label={item.label}
      // ✅ ADDED: hiddenLabel (Prevents MUI layout shift for missing label)
      hiddenLabel
      id={item.id}
      placeholder={item.placeholder}
      error={!!error}
      // HelperText is handled by FieldWrapper, but we can keep error highlight here
      fullWidth
      variant="outlined"
      type={item.type === 'password' ? 'password' : 'text'}
      rows={(item as any).rows || 1}
      disabled={item.disabled}
      size="small" // Preferred for ERPs
    />
  );
};
