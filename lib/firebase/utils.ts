import { Timestamp } from 'firebase/firestore';

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
