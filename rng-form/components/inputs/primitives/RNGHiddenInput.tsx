'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { HiddenFieldItem } from '@/rng-form/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RNGHiddenInput({ item }: { item: HiddenFieldItem<any> }) {
  const { name } = item;
  return (
    <FieldWrapper item={item} name={name}>
      {(field) => <input type="hidden" {...field} value={field.value ?? ''} />}
    </FieldWrapper>
  );
}
