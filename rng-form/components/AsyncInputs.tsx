/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { AsyncAutocompleteItem, AutocompleteOption, FormSchema } from '../types';
import { FieldWrapper } from './FieldWrapper';

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
  const { getValues, watch } = useFormContext();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<readonly AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);

  const dependencyValues = item.dependencies ? watch(item.dependencies) : [];

  const getLabel = (option: AutocompleteOption) => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    if (item.getOptionLabel) return item.getOptionLabel(option);

    return (option as any).label || JSON.stringify(option);
  };

  const fetchOptions = async (query: string) => {
    setLoading(true);
    try {
      const currentValues = getValues() as z.infer<S>;
      const fetched = await item.loadOptions(query, currentValues);
      setOptions(fetched);
    } catch (err) {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useMemo(() => debounce(fetchOptions, 500), [item]);

  useEffect(() => {
    let active = true;
    if (!open) return undefined;

    (async () => {
      setLoading(true);
      try {
        const currentValues = getValues() as z.infer<S>;
        const fetched = await item.loadOptions('', currentValues);
        if (active) setOptions(fetched);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ...dependencyValues]);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <Autocomplete
          {...field}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          multiple={mergedItem.multiple}
          isOptionEqualToValue={(option, value) => {
            if (!value) return false;
            return getLabel(option) === getLabel(value);
          }}
          getOptionLabel={getLabel}
          options={options}
          loading={loading}
          onInputChange={(e, value, reason) => {
            if (reason === 'input') debouncedFetch(value);
          }}
          onChange={(_, data) => field.onChange(data)}
          renderInput={(params) => (
            <TextField
              {...params}
              error={!!fieldState.error}
              hiddenLabel
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
    </FieldWrapper>
  );
}
