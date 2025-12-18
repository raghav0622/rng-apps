/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { FormItem } from './types';
import { NumberFormatOptions } from './types/field-registry';

// Standardized Error Handling
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
  string: z.string().min(1, 'Required'),
  optionalString: z.string().optional().or(z.literal('')),
  number: z.number(),
  optionalNumber: z.number().optional(),
  boolean: z.boolean(),
  date: z.date({ error: 'Date is required' }),
  phone: z.string(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
};

// =============================================================================
// NUMBER & UNIT FORMATTING ENGINE
// =============================================================================

/**
 * Mapping of common abbreviations to Intl.NumberFormat supported unit names.
 */
export const UNIT_ALIASES: Record<string, string> = {
  // Length
  mm: 'millimeter',
  cm: 'centimeter',
  m: 'meter',
  km: 'kilometer',
  in: 'inch',
  ft: 'foot',
  yd: 'yard',
  mi: 'mile',

  // Area
  sqmm: 'square-millimeter',
  sqcm: 'square-centimeter',
  sqm: 'square-meter',
  sqkm: 'square-kilometer',
  sqin: 'square-inch',
  sqft: 'square-foot',
  sqyd: 'square-yard',
  sqmi: 'square-mile',
  ac: 'acre',
  ha: 'hectare',

  // Volume
  ml: 'milliliter',
  l: 'liter',
  cum: 'cubic-meter',
  cuft: 'cubic-foot',
  cuyd: 'cubic-yard',
  cuin: 'cubic-inch',
  gal: 'gallon',
  qt: 'quart',
  pt: 'pint',

  // Mass
  mg: 'milligram',
  g: 'gram',
  kg: 'kilogram',
  t: 'tonne',
  oz: 'ounce',
  lb: 'pound',
  ton: 'ton',

  // Pressure / Force
  n: 'newton',
  kn: 'kilonewton',
  pa: 'pascal',
  kpa: 'kilopascal',
  mpa: 'megapascal',
  bar: 'bar',
  psi: 'pound-per-square-inch',

  // Temp
  c: 'celsius',
  f: 'fahrenheit',
  deg: 'degree',

  // Digital
  b: 'byte',
  kb: 'kilobyte',
  mb: 'megabyte',
  gb: 'gigabyte',
  tb: 'terabyte',
};

const normalizeUnit = (unit: string | undefined): string | undefined => {
  if (!unit) return undefined;
  const lower = unit.toLowerCase().replace(/\s/g, ''); // "cu yd" -> "cuyd"
  return UNIT_ALIASES[lower] || unit;
};

/**
 * Unified formatter for Numbers, Currencies, and Units.
 */
export const formatNumber = (
  value: number | string | undefined | null,
  options: NumberFormatOptions = {},
): string => {
  if (value === '' || value === undefined || value === null) return '';
  const num = Number(value);
  if (isNaN(num)) return String(value);

  const defaultOpts: Intl.NumberFormatOptions = {
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  };

  // 1. Style Setup
  if (options.style) {
    defaultOpts.style = options.style;
  }

  // 2. Currency
  if (options.currency) {
    defaultOpts.currency = options.currency;
    if (!defaultOpts.style) defaultOpts.style = 'currency';
  }

  // 3. Units
  const unitSuffix = '';
  if (options.unit) {
    const normalized = normalizeUnit(options.unit);

    if (defaultOpts.style === 'unit' || !defaultOpts.style) {
      defaultOpts.style = 'unit';
      defaultOpts.unit = normalized;
      defaultOpts.unitDisplay = 'short'; // "10 kg"
    }
  }

  try {
    return new Intl.NumberFormat('en-US', defaultOpts).format(num) + unitSuffix;
  } catch (error) {
    // Fallback if Intl doesn't support the specific unit
    const fallbackNum = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: defaultOpts.maximumFractionDigits,
      minimumFractionDigits: defaultOpts.minimumFractionDigits,
    }).format(num);
    return options.unit ? `${fallbackNum} ${options.unit}` : fallbackNum;
  }
};

// =============================================================================
// HELPERS
// =============================================================================

export const getFieldNames = (items: FormItem<any>[], prefix?: string): string[] => {
  let names: string[] = [];
  items.forEach((item) => {
    if (item.name) names.push(prefix ? `${prefix}.${item.name}` : item.name);

    const it = item as any;
    const children = it.children || it.items || it.tabs || it.steps;

    if (children && Array.isArray(children)) {
      if (item.type === 'section' || item.type === 'modal-form')
        names = names.concat(getFieldNames(it.children, prefix));
      if (item.type === 'tabs')
        it.tabs.forEach((t: any) => (names = names.concat(getFieldNames(t.children, prefix))));
      if (item.type === 'accordion')
        it.items.forEach((i: any) => (names = names.concat(getFieldNames(i.children, prefix))));
      if (item.type === 'wizard')
        it.steps.forEach((s: any) => (names = names.concat(getFieldNames(s.children, prefix))));
    }
  });
  return names;
};
