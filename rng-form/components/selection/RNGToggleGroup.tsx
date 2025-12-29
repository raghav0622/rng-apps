'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

interface RNGToggleGroupProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'toggle-group' };
  pathPrefix?: string; // ✅ Added support for scoped paths
}

export function RNGToggleGroup<S extends FormSchema>({ item, pathPrefix }: RNGToggleGroupProps<S>) {
  const {
    options,
    getOptionLabel = (opt: any) => (typeof opt === 'string' ? opt : opt.label || String(opt)),
    getOptionValue = (opt: any) =>
      typeof opt === 'string' ? opt : opt.value !== undefined ? opt.value : opt,
  } = item;

  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, _fieldState, mergedItem) => {
        // 🛡️ Safe check for 'exclusive' property
        const isExclusive = 'exclusive' in mergedItem ? (mergedItem as any).exclusive : false;

        return (
          <ToggleButtonGroup
            value={field.value}
            exclusive={isExclusive}
            onChange={(_e, newVal) => field.onChange(newVal)}
            aria-label={mergedItem.label}
            fullWidth
            disabled={mergedItem.disabled}
          >
            {options.map((option, index) => {
              const label = getOptionLabel(option);
              const value = getOptionValue(option);
              const icon = typeof option === 'object' ? (option as any).icon : undefined;

              return (
                <ToggleButton key={`${item.name}-toggle-${index}`} value={value}>
                  {icon}
                  {label}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        );
      }}
    </FieldWrapper>
  );
}
