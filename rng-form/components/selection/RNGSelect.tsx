'use client';

import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { getOptionLabel, getOptionValue } from '@/rng-form/utils/selection'; // Adjusted path to alias if needed, or keep relative
import { FormControl, MenuItem, Select } from '@mui/material';

interface RNGSelectProps<S extends FormSchema> {
  item: InputItem<S> & {
    type: 'select'; // Explicit type narrowing
    options?: any[];
    getOptionLabel?: (opt: any) => string;
    getOptionValue?: (opt: any) => string | number;
  };
  pathPrefix?: string; // ✅ Added support for scoped paths
}

export function RNGSelect<S extends FormSchema>({ item, pathPrefix }: RNGSelectProps<S>) {
  // Use options from item, default to empty array
  const options = item.options || [];

  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, fieldState, mergedItem) => (
        <FormControl fullWidth error={!!fieldState.error} disabled={mergedItem.disabled}>
          <Select
            {...field} // passes value, onChange, onBlur, ref
            displayEmpty
            // 1. Render Value (The "Closed" View)
            renderValue={(selected) => {
              if (selected === '' || selected === null || selected === undefined) {
                return (
                  <em style={{ color: '#aaa', fontStyle: 'normal' }}>
                    {mergedItem.placeholder || 'Select...'}
                  </em>
                );
              }

              // Find the full option object corresponding to this selected ID
              const selectedOption = options.find(
                (opt) => getOptionValue(opt, mergedItem) === selected,
              );

              return selectedOption ? getOptionLabel(selectedOption, mergedItem) : selected; // Fallback
            }}
          >
            <MenuItem disabled value="">
              <em>{mergedItem.placeholder || 'Select...'}</em>
            </MenuItem>

            {/* 2. Render Options (The Dropdown List) */}
            {options.map((option, index) => {
              const val = getOptionValue(option, mergedItem);
              const label = getOptionLabel(option, mergedItem);

              return (
                <MenuItem key={`${val}-${index}`} value={val}>
                  {label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      )}
    </FieldWrapper>
  );
}
