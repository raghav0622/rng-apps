'use client';

import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { useTaxonomy } from '@/rng-form/hooks/useTaxonomy';
import { FormSchema, InputItem } from '@/rng-form/types';
import {
  Autocomplete,
  Chip,
  CircularProgress,
  createFilterOptions,
  TextField,
} from '@mui/material';
import React from 'react';

// Helper to define specific props
type TaxonomyFieldItem = InputItem<any> & {
  type: 'taxonomy';
  scope: string;
  placeholder?: string;
  multiple?: boolean;
  creatable?: boolean;
};

interface TaxonomyInputProps<S extends FormSchema> {
  item: TaxonomyFieldItem;
  pathPrefix?: string; // ✅ Added support for scoped paths
}

const filter = createFilterOptions<any>();

export function TaxonomyInput<S extends FormSchema>({ item, pathPrefix }: TaxonomyInputProps<S>) {
  // Data hooks remain at the top level
  const { options, isLoading, onCreate } = useTaxonomy(item.scope);

  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, fieldState, mergedItem) => {
        // Safe access to specific properties
        const isMultiple = (mergedItem as any).multiple;
        const isCreatable = (mergedItem as any).creatable;

        // Safe Filter Logic
        const filterOptions = (options: any[], params: any) => {
          const filtered = filter(options, params);
          const { inputValue } = params;

          // Suggest creation if enabled and input exists
          if (isCreatable !== false && inputValue !== '') {
            const exists = options.some(
              (opt) => opt.label.toLowerCase() === inputValue.toLowerCase(),
            );

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
            // ✅ Correct MUI props from mergedItem
            multiple={isMultiple}
            freeSolo={isCreatable !== false}
            // Value Handling
            value={field.value || (isMultiple ? [] : null)}
            onChange={(_, newValue) => {
              // --- CASE 1: MULTIPLE SELECT ---
              if (isMultiple) {
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
                field.onChange(cleanValues);
                return;
              }

              // --- CASE 2: SINGLE SELECT ---
              if (typeof newValue === 'string') {
                field.onChange(newValue);
              } else if (newValue && newValue.inputValue) {
                const created = onCreate(newValue.inputValue);
                field.onChange(created.value);
              } else {
                field.onChange(newValue?.value || null);
              }
            }}
            filterOptions={filterOptions}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            options={options}
            disabled={mergedItem.disabled}
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

                return (
                  <Chip variant="outlined" label={label} {...getTagProps({ index })} key={index} />
                );
              })
            }
            loading={isLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                // Pass ref and onBlur from field (handled by Autocomplete largely, but good for focus)
                inputRef={field.ref}
                onBlur={field.onBlur}
                // FieldWrapper handles the external label, so we hide this one or use placeholder
                placeholder={mergedItem.placeholder || 'Select...'}
                error={!!fieldState.error}
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
      }}
    </FieldWrapper>
  );
}
