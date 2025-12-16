'use client';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs'; // FIX 1: Import dayjs default
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
            // FIX 2: Convert native Date (from form state) to Dayjs (for MUI)
            value={field.value ? dayjs(field.value) : null}
            // FIX 3: Convert Dayjs (from MUI) back to native Date (for Zod validation)
            onChange={(date: Dayjs | null) => {
              field.onChange(date ? date.toDate() : null);
            }}
            disabled={item.disabled}
            minDate={item.minDate ? dayjs(item.minDate) : undefined}
            maxDate={item.maxDate ? dayjs(item.maxDate) : undefined}
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

// ... rest of the file (RNGAutocomplete) remains unchanged
export function RNGAutocomplete<S extends FormSchema>({ item }: { item: AutocompleteItem<S> }) {
  const { control } = useFormContext();

  const getLabel = (option: string | AutocompleteOption): string => {
    if (typeof option === 'string') return option;
    if (item.getOptionLabel) return item.getOptionLabel(option);
    // Fallback for objects if getOptionLabel isn't provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (option as any).label || JSON.stringify(option);
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
