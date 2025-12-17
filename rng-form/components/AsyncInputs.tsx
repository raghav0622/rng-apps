'use client';
import { logError } from '@/lib/logger';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { AsyncAutocompleteItem, AutocompleteOption } from '../types';
import { FieldWrapper } from './FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGAsyncAutocomplete({ item }: { item: AsyncAutocompleteItem<any> }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<readonly AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { getValues } = useFormContext();

  // Debounce logic for fetching
  useEffect(() => {
    let active = true;

    if (!open) {
      return undefined;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const currentFormValues = getValues();
        const results = await item.loadOptions(inputValue, currentFormValues);
        if (active) {
          setOptions(results);
        }
      } catch (err) {
        logError('Async Fetch Error', { error: err });
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 400); // 400ms debounce

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
          getOptionLabel={
            mergedItem.getOptionLabel ||
            ((opt) => (typeof opt === 'string' ? opt : (opt as any).label || ''))
          }
          isOptionEqualToValue={(opt, val) => {
            const optVal = typeof opt === 'string' ? opt : (opt as any).value;
            const fieldVal = typeof val === 'string' ? val : (val as any).value;
            return optVal === fieldVal;
          }}
          onChange={(_, data) => field.onChange(data)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={mergedItem.label} // Internal label behavior
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
