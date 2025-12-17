'use client';
import { Stack, TextField } from '@mui/material';
import { DateFieldItem, DateRangeItem } from '../../types';
import { FieldWrapper } from '../FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGDateInput({ item }: { item: DateFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState) => (
        <TextField
          {...field}
          type="date"
          fullWidth
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

export function RNGDateRange({ item }: { item: DateRangeItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field) => {
        const val = field.value || { start: null, end: null };
        return (
          <Stack direction="row" spacing={2}>
            <TextField
              type="date"
              label="Start Date"
              fullWidth
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
