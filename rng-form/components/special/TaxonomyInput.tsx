'use client';

import {
  Autocomplete,
  Chip,
  CircularProgress,
  createFilterOptions,
  TextField,
} from '@mui/material';
import React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { useTaxonomy } from '../../hooks/useTaxonomy';
import { InputItem } from '../../types/inputs';

// Helper to define specific props
type TaxonomyFieldItem = InputItem<any> & {
  type: 'taxonomy';
  scope: string;
  placeholder?: string;
  multiple?: boolean;
  creatable?: boolean;
};

interface TaxonomyInputProps {
  item: TaxonomyFieldItem;
}

const filter = createFilterOptions<any>();

export const TaxonomyInput: React.FC<TaxonomyInputProps> = ({ item }) => {
  const { control } = useFormContext();
  const { options, isLoading, onCreate } = useTaxonomy(item.scope);

  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({
    name: item.name!,
    control,
    rules: { required: item.required ? 'This field is required' : false },
  });

  // Safe Filter Logic
  const filterOptions = (options: any[], params: any) => {
    const filtered = filter(options, params);
    const { inputValue } = params;

    // Suggest creation if enabled and input exists
    if (item.creatable !== false && inputValue !== '') {
      const exists = options.some((opt) => opt.label.toLowerCase() === inputValue.toLowerCase());

      if (!exists) {
        filtered.push({
          inputValue,
          label: `Add "${inputValue}"`,
          value: inputValue,
          isNew: true,
        });
      }
    }
    return filtered;
  };

  return (
    <Autocomplete
      multiple={item.multiple} // ✅ PASS MULTIPLE PROP
      freeSolo={item.creatable !== false}
      // Value Handling
      value={value || (item.multiple ? [] : null)}
      onChange={(_, newValue) => {
        // --- CASE 1: MULTIPLE SELECT ---
        if (item.multiple) {
          // newValue is an Array of (string | OptionObject)
          const cleanValues = (newValue as any[]).map((val) => {
            if (typeof val === 'string') return val;
            if (val.inputValue) {
              // Create on the fly
              const created = onCreate(val.inputValue);
              return created.value; // Store just the string ID/Value
            }
            return val.value; // Store just the string ID/Value
          });
          onChange(cleanValues);
          return;
        }

        // --- CASE 2: SINGLE SELECT ---
        if (typeof newValue === 'string') {
          onChange(newValue);
        } else if (newValue && newValue.inputValue) {
          const created = onCreate(newValue.inputValue);
          onChange(created.value);
        } else {
          onChange(newValue?.value || null);
        }
      }}
      filterOptions={filterOptions}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      options={options}
      // Label Mapping
      getOptionLabel={(option) => {
        // Option can be a raw string (if stored in DB) or an object (from options list)
        if (typeof option === 'string') {
          const found = options.find((o) => o.value === option);
          return found ? found.label : option;
        }
        if (option.inputValue) return option.inputValue;
        return option.label;
      }}
      isOptionEqualToValue={(option, val) => {
        const optVal = option.value || option;
        const fieldVal = val.value || val;
        return optVal === fieldVal;
      }}
      // Custom Rendering
      renderOption={(props, option) => {
        const { key, ...optionProps } = props as any;
        return (
          <li key={key} {...optionProps}>
            {option.isNew ? `Add "${option.inputValue}"` : option.label}
          </li>
        );
      }}
      renderTags={(value: readonly any[], getTagProps) =>
        value.map((option: any, index: number) => {
          const label =
            typeof option === 'string'
              ? options.find((o) => o.value === option)?.label || option
              : option.label;

          return <Chip variant="outlined" label={label} {...getTagProps({ index })} key={index} />;
        })
      }
      loading={isLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={ref}
          hiddenLabel // ✅ ADDED
          placeholder={item.placeholder || 'Select...'}
          error={!!error}
          // helperText handled by FieldWrapper usually, but we can pass params
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            },
          }}
        />
      )}
    />
  );
};
