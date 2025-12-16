'use client';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FieldWrapper } from '../FieldWrapper';
import { AsyncAutocompleteItem, AutocompleteOption, FormSchema } from '../types';

export function RNGAsyncAutocomplete<S extends FormSchema>({
  item,
}: {
  item: AsyncAutocompleteItem<S>;
}) {
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<readonly AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to handle option labels
  const getLabel = (option: AutocompleteOption) => {
    if (typeof option === 'string') return option;
    if (item.getOptionLabel) return item.getOptionLabel(option);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (option as any).label || JSON.stringify(option);
  };

  useEffect(() => {
    let active = true;

    if (!open) {
      return undefined;
    }

    (async () => {
      setLoading(true);
      // Pass empty string for initial load
      const fetched = await item.loadOptions('');
      if (active) {
        setOptions(fetched);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, item]);

  // Handle Search Input Change
  const handleInputChange = async (event: React.SyntheticEvent, value: string, reason: string) => {
    if (reason === 'input') {
      setLoading(true);
      const fetched = await item.loadOptions(value);
      setOptions(fetched);
      setLoading(false);
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
            isOptionEqualToValue={(option, value) => getLabel(option) === getLabel(value)}
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
