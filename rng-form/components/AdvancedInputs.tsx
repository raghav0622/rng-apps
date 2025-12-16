'use client';
import { CloudUpload } from '@mui/icons-material';
import { Autocomplete, Box, Button, Chip, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import {
  AutocompleteItem,
  AutocompleteOption,
  DateFieldItem,
  FileItem,
  FormSchema,
} from '../types';
import { FieldWrapper } from './FieldWrapper';

// --- Date Input ---
export function RNGDateInput<S extends FormSchema>({ item }: { item: DateFieldItem<S> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <DatePicker
          value={field.value ? dayjs(field.value) : null}
          onChange={(date: Dayjs | null) => {
            field.onChange(date ? date.toDate() : null);
          }}
          disabled={mergedItem.disabled}
          minDate={mergedItem.minDate ? dayjs(mergedItem.minDate) : undefined}
          maxDate={mergedItem.maxDate ? dayjs(mergedItem.maxDate) : undefined}
          slotProps={{
            textField: {
              fullWidth: true,
              error: !!fieldState.error,
              // Label handled by Wrapper usually, but DatePicker needs strict slot
              hiddenLabel: true,
              // We render DatePicker inside Wrapper, so Wrapper label shows up top.
              // DatePicker inputs often look better with the label inside the border.
              // If you prefer internal label, disable wrapper label in FieldWrapper logic
              // or just pass label here and suppress wrapper label.
              // For consistency, we use wrapper label.
            },
          }}
        />
      )}
    </FieldWrapper>
  );
}

// --- Autocomplete ---
export function RNGAutocomplete<S extends FormSchema>({ item }: { item: AutocompleteItem<S> }) {
  const getLabel = (option: string | AutocompleteOption): string => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    if (item.getOptionLabel) return item.getOptionLabel(option);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (option as any).label || JSON.stringify(option);
  };

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <Autocomplete
          {...field}
          multiple={mergedItem.multiple}
          freeSolo={mergedItem.creatable}
          options={mergedItem.options}
          getOptionLabel={(option) => getLabel(option as AutocompleteOption)}
          isOptionEqualToValue={(option, value) => {
            if (!value) return false;
            return getLabel(option) === getLabel(value);
          }}
          onChange={(_event, data) => field.onChange(data)}
          renderInput={(params) => <TextField {...params} error={!!fieldState.error} hiddenLabel />}
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
    </FieldWrapper>
  );
}

// --- File Upload ---
export function RNGFileUpload<S extends FormSchema>({ item }: { item: FileItem<S> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => {
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
            <Typography gutterBottom>{mergedItem.label}</Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              color={fieldState.error ? 'error' : 'primary'}
              fullWidth
              disabled={mergedItem.disabled}
            >
              Upload File
              <input
                type="file"
                hidden
                multiple={mergedItem.multiple}
                accept={mergedItem.accept}
                onChange={(e) => {
                  const selectedFiles = e.target.files;
                  if (mergedItem.multiple) {
                    field.onChange(selectedFiles);
                  } else {
                    field.onChange(selectedFiles ? selectedFiles[0] : null);
                  }
                }}
                ref={field.ref}
              />
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {displayText}
            </Typography>
          </Box>
        );
      }}
    </FieldWrapper>
  );
}
