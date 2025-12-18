'use client';
import { logError } from '@/lib/logger';
import { useFormContext } from 'react-hook-form';
import { FormItem, FormSchema } from '../types';
import { INPUT_REGISTRY, LAYOUT_REGISTRY } from './registry';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RenderItemProps<S extends FormSchema> {
  item: FormItem<S>;
  pathPrefix?: string;
}

export function RenderItem<S extends FormSchema>({ item, pathPrefix }: RenderItemProps<S>) {
  const { register } = useFormContext();

  // Calculate the correct "name" for React Hook Form registration
  const scopedName = pathPrefix && item.name ? `${pathPrefix}.${item.name}` : item.name;

  // Create a scoped item, preserving ALL properties from the incoming 'item' (which is the mergedItem)
  // This ensures 'disabled', 'label', or other props set via logic are kept.
  const scopedItem = {
    ...item,
    name: scopedName,
  };

  if (item.type === 'hidden') {
    return <input type="hidden" {...register(scopedName as any)} />;
  }

  const Component = (LAYOUT_REGISTRY as any)[item.type] || (INPUT_REGISTRY as any)[item.type];

  if (Component) {
    // Pass the scopedItem (with dynamic props) and pathPrefix to the component
    return <Component item={scopedItem as any} pathPrefix={pathPrefix} />;
  }

  logError(`No component found for type: ${item.type}`);
  return null;
}
