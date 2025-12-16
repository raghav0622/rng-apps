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
