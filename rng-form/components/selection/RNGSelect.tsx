'use client';

import { FormControl, MenuItem, Select } from '@mui/material';
import React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { InputItem } from '../../types';
import { getOptionLabel, getOptionValue } from '../../utils/selection';

interface RNGSelectProps {
  item: InputItem<any> & {
    options?: any[];
    getOptionLabel?: (opt: any) => string;
    getOptionValue?: (opt: any) => string | number;
  };
}

export const RNGSelect: React.FC<RNGSelectProps> = ({ item }) => {
  const { control } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({
    name: item.name!,
    control,
    rules: { required: item.required ? 'This field is required' : false },
  });

  const options = item.options || [];

  return (
    <FormControl fullWidth error={!!error} size="small" disabled={item.disabled}>
      <Select
        {...field}
        displayEmpty
        // 1. Render Value (The "Closed" View)
        renderValue={(selected) => {
          if (selected === '' || selected === null || selected === undefined) {
            return (
              <em style={{ color: '#aaa', fontStyle: 'normal' }}>
                {item.placeholder || 'Select...'}
              </em>
            );
          }

          // Find the full option object corresponding to this selected ID
          const selectedOption = options.find((opt) => getOptionValue(opt, item) === selected);

          return selectedOption ? getOptionLabel(selectedOption, item) : selected; // Fallback if option missing (e.g. async loading)
        }}
      >
        <MenuItem disabled value="">
          <em>{item.placeholder || 'Select...'}</em>
        </MenuItem>

        {/* 2. Render Options (The Dropdown List) */}
        {options.map((option, index) => {
          const val = getOptionValue(option, item);
          const label = getOptionLabel(option, item);

          return (
            <MenuItem key={`${val}-${index}`} value={val}>
              {label}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
