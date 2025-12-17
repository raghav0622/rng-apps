'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Stack, TextField } from '@mui/material';

interface RNGDateInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'date' };
}

export function RNGDateInput<S extends FormSchema>({ item }: RNGDateInputProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <TextField
          {...field}
          type="date"
          fullWidth
          disabled={mergedItem.disabled}
          error={!!fieldState.error}
          // Handle string vs Date object for input value
          value={
            field.value instanceof Date
              ? field.value.toISOString().split('T')[0]
              : (field.value ?? '')
          }
          // Convert back to Date object on change
          onChange={(e) => field.onChange((e.target as HTMLInputElement).valueAsDate)}
        />
      )}
    </FieldWrapper>
  );
}

interface RNGDateRangeProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'date-range' };
}

export function RNGDateRange<S extends FormSchema>({ item }: RNGDateRangeProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _fieldState, mergedItem) => {
        const val = field.value || { start: null, end: null };
        return (
          <Stack direction="row" spacing={2}>
            <TextField
              type="date"
              label="Start Date"
              fullWidth
              disabled={mergedItem.disabled}
              InputLabelProps={{ shrink: true }}
              value={
                val.start instanceof Date
                  ? val.start.toISOString().split('T')[0]
                  : (val.start ?? '')
              }
              onChange={(e) =>
                field.onChange({
                  ...val,
                  start: (e.target as HTMLInputElement).valueAsDate,
                })
              }
            />
            <TextField
              type="date"
              label="End Date"
              fullWidth
              disabled={mergedItem.disabled}
              InputLabelProps={{ shrink: true }}
              value={
                val.end instanceof Date ? val.end.toISOString().split('T')[0] : (val.end ?? '')
              }
              onChange={(e) =>
                field.onChange({
                  ...val,
                  end: (e.target as HTMLInputElement).valueAsDate,
                })
              }
            />
          </Stack>
        );
      }}
    </FieldWrapper>
  );
}
