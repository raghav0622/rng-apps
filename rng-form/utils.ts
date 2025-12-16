import { z } from 'zod';

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
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian Phone Number'),

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
