'use client';
import { logError } from '@/lib/logger';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { AutocompleteOption, FormSchema, InputItem } from '@/rng-form/types';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

  const {
    getOptionLabel = (opt: any) => (typeof opt === 'string' ? opt : opt.label || opt.name || String(opt)),
    getOptionValue = (opt: any) => (typeof opt === 'string' ? opt : opt.value !== undefined ? opt.value : opt),
    isOptionEqualToValue = (opt: any, val: any) => {
      if (!val) return false;
      const optVal = getOptionValue(opt);
      const fieldVal = typeof val === 'object' && val !== null ? getOptionValue(val) : val;
      return optVal === fieldVal;
    }
  } = item;

  useEffect(() => {
    let active = true;
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
      {(field, fieldState, mergedItem) => {
        const value = field.value === undefined ? (mergedItem.multiple ? [] : null) : field.value;

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
            options={options}
            loading={loading}
            disabled={mergedItem.disabled}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={(_, data) => field.onChange(data)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={mergedItem.label}
                placeholder={mergedItem.placeholder}
                error={!!fieldState.error}
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
