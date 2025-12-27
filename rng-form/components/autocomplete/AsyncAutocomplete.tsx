'use client';
import { logError } from '@/lib/logger';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { AutocompleteOption, FormSchema, InputItem } from '@/rng-form/types';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

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
    getOptionLabel = (opt: any) =>
      typeof opt === 'string' ? opt : opt.label || opt.name || String(opt),
    getOptionValue = (opt: any) =>
      typeof opt === 'string' ? opt : opt.value !== undefined ? opt.value : opt,
    isOptionEqualToValue = (opt: any, val: any) => {
      if (!val) return false;
      const optVal = getOptionValue(opt);
      const fieldVal = typeof val === 'object' && val !== null ? getOptionValue(val) : val;
      return optVal === fieldVal;
    },
  } = item;

  const safeGetOptionLabel = (opt: any) => {
    if (typeof opt !== 'object' || opt === null) return String(opt);
    return getOptionLabel(opt) || String(opt);
  };

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
        let value = field.value === undefined ? (mergedItem.multiple ? [] : null) : field.value;

        if (value && !mergedItem.multiple && typeof value !== 'object') {
          const found = options.find((opt) => getOptionValue(opt) === value);
          if (found) value = found;
        }

        return (
          <Autocomplete
            // 🛡️ Correct MUI Autocomplete Props
            ref={field.ref}
            onBlur={field.onBlur}
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
            getOptionLabel={safeGetOptionLabel}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={(_, data) => {
              if (Array.isArray(data)) {
                field.onChange(data.map((opt) => getOptionValue(opt)));
              } else {
                field.onChange(data ? getOptionValue(data) : null);
              }
            }}
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
