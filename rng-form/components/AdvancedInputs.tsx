'use client';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';
import { Controller, useFormContext } from 'react-hook-form';
import { FieldWrapper } from '../FieldWrapper';
import { AutocompleteItem, AutocompleteOption, DateFieldItem, FormSchema } from '../types';

// --- Date Input ---
export function RNGDateInput<S extends FormSchema>({ item }: { item: DateFieldItem<S> }) {
  const { control } = useFormContext();

  return (
    <FieldWrapper item={item}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            label={item.label}
            value={field.value as Dayjs | null}
            onChange={field.onChange}
            disabled={item.disabled}
            minDate={item.minDate ? (item.minDate as unknown as Dayjs) : undefined}
            maxDate={item.maxDate ? (item.maxDate as unknown as Dayjs) : undefined}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error?.message || item.description,
              },
            }}
          />
        )}
      />
    </FieldWrapper>
  );
}

// --- Autocomplete (Select/Combobox) ---
export function RNGAutocomplete<S extends FormSchema>({ item }: { item: AutocompleteItem<S> }) {
  const { control } = useFormContext();

  const getLabel = (option: string | AutocompleteOption): string => {
    if (typeof option === 'string') return option;
    if (item.getOptionLabel) return item.getOptionLabel(option);
    return JSON.stringify(option);
  };

  return (
    <FieldWrapper item={item}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Autocomplete
            {...field}
            multiple={item.multiple}
            freeSolo={item.creatable}
            options={item.options}
            getOptionLabel={(option) => getLabel(option as AutocompleteOption)}
            onChange={(_event, data) => field.onChange(data)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={item.label}
                error={!!error}
                helperText={error?.message || item.description}
              />
            )}
            renderTags={(value: readonly AutocompleteOption[], getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={getLabel(option)}
                  {...getTagProps({ index })}
                  key={index}
                />
              ))
            }
          />
        )}
      />
    </FieldWrapper>
  );
}
