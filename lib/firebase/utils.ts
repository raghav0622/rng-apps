import { Timestamp } from 'firebase/firestore';

/**
 * Serializes Firestore data into JSON-safe objects.
 * Essential for passing data from Server Components (RSC) to Client Components,
 * as RSC cannot serialize methods or complex objects like `Timestamp`.
 *
 * @template T
 * @param {T} data - The raw Firestore data.
 * @returns {T} The serialized data with dates converted to ISO strings.
 *
 * @example
 * const user = await getUser();
 * return <ClientComponent user={serializeFirestoreData(user)} />;
 */
export function serializeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Timestamp) {
    return data.toDate().toISOString() as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeFirestoreData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const newObj: Partial<T> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObj[key] = serializeFirestoreData(data[key]);
      }
    }
    return newObj as T;
  }

  return data;
}

/**
 * Normalizes various date formats into a Unix timestamp (milliseconds).
 * Handles Firestore Timestamps, JS Date objects, and existing numbers.
 *
 * @param {Timestamp | Date | number | any} date - The input date.
 * @returns {number} The time in milliseconds, or 0 if invalid.
 */
export function toMillis(date: Timestamp | Date | number | undefined | null | any): number {
  if (!date) return 0;

  // Already a number (Unix timestamp)
  if (typeof date === 'number') return date;

  // Firestore Timestamp (has toMillis method)
  if (typeof date.toMillis === 'function') return date.toMillis();

  // JavaScript Date object
  if (date instanceof Date) return date.getTime();

  return 0;
}
