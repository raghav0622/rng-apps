// raghav0622/rng-apps/rng-apps-32568c5c2cdde8c39887d3f354c7c4470b0fb980/rng-form/components/FieldWrapper.tsx

'use client';

import { Box, FormHelperText, InputLabel, Typography } from '@mui/material';
import React, { ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FIELD_CONFIG } from '../config';
import { InputItem } from '../types';
import { AnyFieldType } from '../types/field-registry';

interface FieldWrapperProps {
  item: InputItem<any>;
  name: string;
  children: (field: any, fieldState: any, item: InputItem<any>) => ReactNode;
  pathPrefix?: string;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({ item, name, children }) => {
  const { control } = useFormContext();

  // 1. Check Config: Does this component handle its own label?
  const config = FIELD_CONFIG[item.type as AnyFieldType];
  const hasInternalLabel = config?.hasInternalLabel ?? false;

  // 2. Build Label Content
  const isRequired = item.required;

  const labelContent = (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {item.label}
      {isRequired ? (
        <Typography component="span" color="error" sx={{ ml: 0.5, fontWeight: 'bold' }}>
          *
        </Typography>
      ) : (
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          (Optional)
        </Typography>
      )}
    </Box>
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Box sx={{ mb: 2 }}>
          {/* 3. Conditionally Render Label */}
          {item.label && !hasInternalLabel && (
            <InputLabel htmlFor={name} error={!!fieldState.error} sx={{ mb: 0.5, display: 'flex' }}>
              {labelContent}
            </InputLabel>
          )}

          {/* Render the Field with actual RHF props */}
          {children(field, fieldState, item)}

          {/* Description / Helper Text */}
          {(item.description || fieldState.error) && (
            <FormHelperText error={!!fieldState.error}>
              {fieldState.error?.message || item.description}
            </FormHelperText>
          )}
        </Box>
      )}
    />
  );
};
