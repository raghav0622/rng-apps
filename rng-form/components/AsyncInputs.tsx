'use client';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { FieldWrapper } from '../FieldWrapper';
import { AsyncAutocompleteItem, AutocompleteOption, FormSchema } from '../types';

// Simple debounce utility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function RNGAsyncAutocomplete<S extends FormSchema>({
  item,
}: {
  item: AsyncAutocompleteItem<S>;
}) {
  const { control, getValues, watch } = useFormContext();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<readonly AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Watch dependencies to re-trigger fetch
  const dependencyValues = item.dependencies ? watch(item.dependencies) : [];

  const getLabel = (option: AutocompleteOption) => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    if (item.getOptionLabel) return item.getOptionLabel(option);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (option as any).label || JSON.stringify(option);
  };

  const fetchOptions = async (query: string) => {
    setLoading(true);
    try {
      // FIX: Type Assertion to z.infer<S> to resolve the "FieldValues" error
      const currentValues = getValues() as z.infer<S>;
      const fetched = await item.loadOptions(query, currentValues);
      setOptions(fetched);
    } catch (err) {
      console.error('Failed to load options', err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Create a debounced version of fetchOptions
  const debouncedFetch = useMemo(() => debounce(fetchOptions, 500), [item]);

  useEffect(() => {
    let active = true;
    if (!open) return undefined;

    // Initial load (no debounce needed for open)
    (async () => {
      setLoading(true);
      try {
        const currentValues = getValues() as z.infer<S>;
        const fetched = await item.loadOptions('', currentValues);
        if (active) {
          setOptions(fetched);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ...dependencyValues]);

  const handleInputChange = (event: React.SyntheticEvent, value: string, reason: string) => {
    if (reason === 'input') {
      // Use debounced fetch for typing
      debouncedFetch(value);
    }
  };

  return (
    <FieldWrapper item={item}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Autocomplete
            {...field}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            multiple={item.multiple}
            isOptionEqualToValue={(option, value) => {
              if (!value) return false;
              return getLabel(option) === getLabel(value);
            }}
            getOptionLabel={getLabel}
            options={options}
            loading={loading}
            onInputChange={handleInputChange}
            onChange={(_, data) => field.onChange(data)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={item.label}
                error={!!error}
                helperText={error?.message || item.description}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />
        )}
      />
    </FieldWrapper>
  );
}
