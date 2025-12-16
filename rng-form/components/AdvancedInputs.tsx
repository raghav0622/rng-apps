'use client';
import { CloudUpload } from '@mui/icons-material';
import { Autocomplete, Box, Button, Chip, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Controller, useFormContext } from 'react-hook-form';
import { FieldWrapper } from '../FieldWrapper';
import {
  AutocompleteItem,
  AutocompleteOption,
  DateFieldItem,
  FileItem,
  FormSchema,
} from '../types';

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
            value={field.value ? dayjs(field.value) : null}
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

// --- Autocomplete ---
export function RNGAutocomplete<S extends FormSchema>({ item }: { item: AutocompleteItem<S> }) {
  const { control } = useFormContext();

  const getLabel = (option: string | AutocompleteOption): string => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    if (item.getOptionLabel) return item.getOptionLabel(option);
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
            // FIX: Added equality check to prevent warnings
            isOptionEqualToValue={(option, value) => {
              if (!value) return false;
              return getLabel(option) === getLabel(value);
            }}
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

// --- File Upload ---
export function RNGFileUpload<S extends FormSchema>({ item }: { item: FileItem<S> }) {
  const { control } = useFormContext();

  return (
    <FieldWrapper item={item}>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => {
          // field.value could be FileList, File, or null/undefined
          const files = field.value as FileList | File | null;
          let displayText = 'No file selected';

          if (files) {
            if (files instanceof FileList) {
              displayText = `${files.length} files selected`;
            } else if (files instanceof File) {
              displayText = files.name;
            }
          }

          return (
            <Box>
              <Typography gutterBottom>{item.label}</Typography>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                color={error ? 'error' : 'primary'}
                fullWidth
              >
                Upload File
                <input
                  type="file"
                  hidden
                  multiple={item.multiple}
                  accept={item.accept}
                  onChange={(e) => {
                    const selectedFiles = e.target.files;
                    if (item.multiple) {
                      field.onChange(selectedFiles);
                    } else {
                      field.onChange(selectedFiles ? selectedFiles[0] : null);
                    }
                  }}
                  // IMPORTANT: Do NOT spread {...field} here because value is managed manually
                  ref={field.ref}
                />
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {displayText}
              </Typography>
              {(error || item.description) && (
                <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>
                  {error?.message || item.description}
                </Typography>
              )}
            </Box>
          );
        }}
      />
    </FieldWrapper>
  );
}
