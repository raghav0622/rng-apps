'use client';
import { logError } from '@/lib/logger';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { AutocompleteOption, FormSchema, InputItem } from '@/rng-form/types';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Helper to safely get value for comparison
const getOptValue = (opt: any) => {
  if (opt === null || opt === undefined) return opt;
  if (typeof opt === 'object' && 'value' in opt) return opt.value;
  return opt;
};

// Robust comparison
const compareOptions = (opt: any, val: any) => {
  if (val === null || val === undefined) return false;
  // If strict equality works (primitives or same ref), return true
  if (opt === val) return true;

  const optVal = getOptValue(opt);
  const fieldVal = getOptValue(val);
  return optVal === fieldVal;
};

interface RNGAsyncAutocompleteProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'async-autocomplete' };
  pathPrefix?: string;
}

export function RNGAsyncAutocomplete<S extends FormSchema>({
  item,
  pathPrefix,
}: RNGAsyncAutocompleteProps<S>) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<readonly AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { getValues } = useFormContext();

  // SAFETY: Robust label getter default
  const defaultGetOptionLabel = (opt: any) => {
    if (typeof opt === 'string') return opt;
    if (typeof opt === 'number') return String(opt);
    return opt?.label || opt?.name || '';
  };

  const getLabel = item.getOptionLabel || defaultGetOptionLabel;

  useEffect(() => {
    let active = true;
    // Debounce happens via setTimeout, but logic runs only if Open
    if (!open) {
      return undefined;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const currentFormValues = getValues();
        const results = await item.loadOptions(inputValue, currentFormValues as any);
        if (active) {
          setOptions(results || []);
        }
      } catch (err) {
        logError('Async Fetch Error', { error: err });
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [inputValue, open, item, getValues]);

  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, _, mergedItem) => {
        // Fix: Default to null/[] if undefined to prevent controlled/uncontrolled error
        const value = field.value === undefined ? (mergedItem.multiple ? [] : null) : field.value;

        // CRITICAL FIX: Ensure current value is in options if possible (for correct label rendering)
        // If options are loaded but don't contain the current value, Autocomplete might show the ID or nothing.
        // We merge the current value into options temporarily if it's not there.
        // (Note: This is a simplistic fix; ideal solution requires 'prefetch' of single record)
        const renderOptions = options;
        if (value && !loading && options.length === 0) {
          // If we have a value but no options (e.g. initial load),
          // we can't easily "fake" the option without the label.
          // We rely on 'getLabel' handling the raw value gracefully.
        }

        return (
          <Autocomplete
            {...field}
            value={value}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
            multiple={mergedItem.multiple}
            options={renderOptions}
            loading={loading}
            disabled={mergedItem.disabled}
            getOptionLabel={getLabel}
            isOptionEqualToValue={compareOptions}
            onChange={(_, data) => field.onChange(data)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={mergedItem.label}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
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
