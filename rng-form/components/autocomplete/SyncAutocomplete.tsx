'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Autocomplete, TextField } from '@mui/material';

interface RNGAutocompleteProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'autocomplete' };
  pathPrefix?: string;
}

export function RNGAutocomplete<S extends FormSchema>({
  item,
  pathPrefix,
}: RNGAutocompleteProps<S>) {
  const {
    options,
    getOptionLabel = (opt: any) => (typeof opt === 'string' ? opt : opt.label || String(opt)),
    getOptionValue = (opt: any) =>
      typeof opt === 'string' ? opt : opt.value !== undefined ? opt.value : opt,
    isOptionEqualToValue = (opt: any, val: any) => {
      if (val === null || val === undefined) return false;
      const optVal = getOptionValue(opt);
      const fieldVal = typeof val === 'object' && val !== null ? getOptionValue(val) : val;
      return optVal === fieldVal;
    },
  } = item;

  const safeGetOptionLabel = (opt: any) => {
    if (typeof opt !== 'object' || opt === null) return String(opt);
    return getOptionLabel(opt) || String(opt);
  };

  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, fieldState, mergedItem) => {
        // 🛡️ Safe check for 'multiple' property to satisfy TypeScript
        const isMultiple = 'multiple' in mergedItem ? (mergedItem as any).multiple : false;

        let value = field.value === undefined ? (isMultiple ? [] : null) : field.value;

        if (value && !isMultiple && typeof value !== 'object') {
          const found = options.find((opt) => getOptionValue(opt) === value);
          if (found) value = found;
        } else if (value && isMultiple && Array.isArray(value)) {
          value = value.map((val) =>
            typeof val !== 'object'
              ? options.find((opt) => getOptionValue(opt) === val) || val
              : val,
          );
        }

        return (
          <Autocomplete
            // 🛡️ Correct props for MUI Autocomplete
            ref={field.ref}
            onBlur={field.onBlur}
            value={value}
            multiple={isMultiple}
            options={options as readonly any[]}
            getOptionLabel={safeGetOptionLabel}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={(_, data) => {
              if (Array.isArray(data)) {
                field.onChange(data.map((opt) => getOptionValue(opt)));
              } else {
                field.onChange(data ? getOptionValue(data) : null);
              }
            }}
            disabled={mergedItem.disabled}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={mergedItem.placeholder || mergedItem.label}
                variant="outlined"
                error={!!fieldState.error}
              />
            )}
          />
        );
      }}
    </FieldWrapper>
  );
}
