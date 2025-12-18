'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Stack, TextField } from '@mui/material';

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
