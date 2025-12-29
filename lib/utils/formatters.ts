/**
 * Utility functions for formatting various data types
 * Used across the application for consistent display formatting
 */

/**
 * Format a date object to a localized string
 * 
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 * 
 * @example
 * ```ts
 * formatDate(new Date()) // "12/29/2025"
 * formatDate(new Date(), { dateStyle: 'long' }) // "December 29, 2025"
 * ```
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format a number as currency
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 * 
 * @example
 * ```ts
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de-DE') // "1.234,56 €"
 * ```
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format minutes as hours and minutes
 * 
 * @param minutes - Total minutes
 * @returns Formatted time string
 * 
 * @example
 * ```ts
 * formatMinutesToHours(90) // "1.5h"
 * formatMinutesToHours(45) // "0.8h"
 * ```
 */
export function formatMinutesToHours(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}h`;
}

/**
 * Format a number with thousands separators
 * 
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 * 
 * @example
 * ```ts
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.5678, 2) // "1,234.57"
 * ```
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage
 * 
 * @param value - Value as decimal (0.25 = 25%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 * 
 * @example
 * ```ts
 * formatPercentage(0.2567) // "25.7%"
 * formatPercentage(0.2567, 2) // "25.67%"
 * ```
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate a string to a maximum length with ellipsis
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 * 
 * @example
 * ```ts
 * truncateString("This is a long string", 10) // "This is a..."
 * truncateString("Short", 10) // "Short"
 * ```
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Format a phone number (US format)
 * 
 * @param phone - Phone number string (digits only or with formatting)
 * @returns Formatted phone number
 * 
 * @example
 * ```ts
 * formatPhoneNumber("1234567890") // "(123) 456-7890"
 * formatPhoneNumber("123-456-7890") // "(123) 456-7890"
 * ```
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone; // Return as-is if not 10 digits
}

/**
 * Format bytes to human-readable size
 * 
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string
 * 
 * @example
 * ```ts
 * formatBytes(1024) // "1.00 KB"
 * formatBytes(1048576) // "1.00 MB"
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
