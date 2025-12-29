'use client';
import { logError } from '@/lib/logger';
import { useFormContext } from 'react-hook-form';
import { FormItem, FormSchema } from '../types';
import { INPUT_REGISTRY, LAYOUT_REGISTRY } from './registry';

interface RenderItemProps<S extends FormSchema> {
  item: FormItem<S>;
  pathPrefix?: string;
}

export function RenderItem<S extends FormSchema>({ item, pathPrefix }: RenderItemProps<S>) {
  const { register } = useFormContext();

  // Calculate the correct "name" for React Hook Form registration
  const scopedName = pathPrefix && item.name ? `${pathPrefix}.${item.name}` : item.name;

  // Cleanup logic props
  const { renderLogic, propsLogic, dependencies, ...cleanItem } = item;

  const scopedItem = {
    ...cleanItem,
    name: scopedName,
  };

  // 1. Hidden Input (Special Case)
  if (item.type === 'hidden') {
    return <input type="hidden" {...register(scopedName as any)} />;
  }

  // 2. Layout Components (Sections, Tabs, etc.)
  // These are NOT wrapped because they are structural
  const LayoutComponent = (LAYOUT_REGISTRY as any)[item.type];
  if (LayoutComponent) {
    return <LayoutComponent item={scopedItem as any} pathPrefix={pathPrefix} />;
  }

  // 3. Input Components (Text, Select, Taxonomy, etc.)
  // These MUST be wrapped to show Labels and Errors
  const InputComponent = (INPUT_REGISTRY as any)[item.type];

  if (InputComponent) {
    return (
      <>
        <InputComponent item={scopedItem as any} pathPrefix={pathPrefix} />
      </>
    );
  }

  logError(`No component found for type: ${item.type}`);
  return null;
}
