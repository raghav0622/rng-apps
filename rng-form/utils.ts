import { z } from 'zod';
import { FormItem } from './types';

// Standardized Error Handling for Server Actions or API calls
export class FormError extends Error {
  constructor(
    public message: string,
    public path?: string,
  ) {
    super(message);
  }
}

// Zod Helpers
export const zUtils = {
  // Strings
  string: z.string().min(1, 'Required'),
  optionalString: z.string().optional().or(z.literal('')),

  // Numbers
  number: z.number(),
  optionalNumber: z.number().optional(),

  // Booleans
  boolean: z.boolean(),

  // Dates
  date: z.date({ error: 'Date is required' }),

  // Custom: Indian Phone
  phone: z.string(),

  // Custom: Password (Min 8 chars, 1 uppercase, etc. - adjustable)
  password: z.string().min(6, 'Password must be at least 6 characters'),
};

// Helper to format currency for display
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to recursively collect field names from a list of FormItems
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getFieldNames = (items: FormItem<any>[], prefix?: string): string[] => {
  let names: string[] = [];

  items.forEach((item) => {
    // 1. Add current item's name if it exists (handles primitives, arrays, etc.)
    if (item.name) {
      names.push(prefix ? `${prefix}.${item.name}` : item.name);
    }

    // 2. Recursively find names in nested layout structures
    switch (item.type) {
      case 'section':
        if (item.children) {
          names = names.concat(getFieldNames(item.children, prefix));
        }
        break;

      case 'tabs':
        if (item.tabs) {
          item.tabs.forEach((tab) => {
            names = names.concat(getFieldNames(tab.children, prefix));
          });
        }
        break;

      case 'accordion':
        if (item.items) {
          item.items.forEach((accordionItem) => {
            names = names.concat(getFieldNames(accordionItem.children, prefix));
          });
        }
        break;

      // Note: We generally don't recurse into 'wizard' (nested wizards have own scope)
      // or 'array' children (array is validated as a single field usually)
    }
  });

  return names;
};
