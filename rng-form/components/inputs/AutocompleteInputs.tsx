'use client';
import { logError } from '@/lib/logger';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { AutocompleteOption, FormSchema, InputItem } from '@/rng-form/types';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Helper to safe compare options
const compareOptions = (opt: any, val: any) => {
  if (!val) return false;
  const optVal = typeof opt === 'string' ? opt : opt.value;
  const fieldVal = typeof val === 'string' ? val : val.value;
  return optVal === fieldVal;
};

// --- SYNC AUTOCOMPLETE ---
interface RNGAutocompleteProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'autocomplete' };
}

export function RNGAutocomplete<S extends FormSchema>({ item }: RNGAutocompleteProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Autocomplete
          {...field}
          multiple={mergedItem.multiple}
          options={mergedItem.options as readonly any[]}
          getOptionLabel={
            mergedItem.getOptionLabel ||
            ((opt) => (typeof opt === 'string' ? opt : (opt as any).label || ''))
          }
          isOptionEqualToValue={compareOptions}
          onChange={(_, data) => field.onChange(data)}
          disabled={mergedItem.disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={mergedItem.label}
              variant="outlined"
              error={!!_?.error}
            />
          )}
        />
      )}
    </FieldWrapper>
  );
}

// --- ASYNC AUTOCOMPLETE ---
interface RNGAsyncAutocompleteProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'async-autocomplete' };
}

export function RNGAsyncAutocomplete<S extends FormSchema>({ item }: RNGAsyncAutocompleteProps<S>) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<readonly AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { getValues } = useFormContext();

  useEffect(() => {
    let active = true;

    if (!open) {
      return undefined;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const currentFormValues = getValues();
        // We know item.loadOptions exists because of strict type
        const results = await item.loadOptions(inputValue, currentFormValues as any);
        if (active) {
          setOptions(results);
        }
      } catch (err) {
        logError('Async Fetch Error', { error: err });
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 400); // Debounce

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [inputValue, open, item, getValues]);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Autocomplete
          {...field}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          inputValue={inputValue}
          onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
          multiple={mergedItem.multiple}
          options={options}
          loading={loading}
          disabled={mergedItem.disabled}
          getOptionLabel={
            mergedItem.getOptionLabel ||
            ((opt) => (typeof opt === 'string' ? opt : (opt as any).label || ''))
          }
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
      )}
    </FieldWrapper>
  );
}
