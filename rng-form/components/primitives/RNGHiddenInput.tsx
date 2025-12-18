'use client';
import { FormSchema, InputItem } from '@/rng-form/types';
import { useFormContext } from 'react-hook-form';

interface RNGHiddenInputProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'hidden' };
}

export function RNGHiddenInput<S extends FormSchema>({ item }: RNGHiddenInputProps<S>) {
  const { register } = useFormContext();
  // Hidden inputs are often rendered directly in FormBuilder,
  // but if this component is used, we ensure it registers correctly.
  return <input type="hidden" {...register(item.name)} />;
}
