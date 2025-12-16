'use client';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller, useFormContext } from 'react-hook-form';
import { FieldWrapper } from '../FieldWrapper';
import { AutocompleteItem, DateFieldItem } from '../types';

// --- Date Input ---
export function RNGDateInput({ item }: { item: DateFieldItem<any> }) {
  const { control } = useFormContext();

  return (
    <FieldWrapper item={item}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            label={item.label}
            value={field.value || null}
            onChange={field.onChange}
            disabled={item.disabled}
            minDate={item.minDate}
            maxDate={item.maxDate}
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
export function RNGAutocomplete({ item }: { item: AutocompleteItem<any> }) {
  const { control } = useFormContext();

  return (
    <FieldWrapper item={item}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Autocomplete
            {...field}
            multiple={item.multiple}
            freeSolo={item.creatable} // Allows creating new items
            options={item.options}
            getOptionLabel={item.getOptionLabel || ((opt) => opt)}
            // Ensure we handle the onChange correctly for object/string values
            onChange={(_, data) => field.onChange(data)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={item.label}
                error={!!error}
                helperText={error?.message || item.description}
              />
            )}
            renderTags={(value: any[], getTagProps) =>
              value.map((option: any, index: number) => (
                <Chip
                  variant="outlined"
                  label={item.getOptionLabel ? item.getOptionLabel(option) : option}
                  {...getTagProps({ index })}
                />
              ))
            }
          />
        )}
      />
    </FieldWrapper>
  );
}
