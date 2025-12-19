import { describe, expect, it } from 'vitest';
import { extractPathFromUrl } from './storage.utils';

describe('Storage Utils', () => {
  describe('extractPathFromUrl', () => {
    it('should extract path from Firebase Storage URL', () => {
      const url =
        'https://firebasestorage.googleapis.com/v0/b/my-app.appspot.com/o/users%2F123%2Favatar.jpg?alt=media';
      const path = extractPathFromUrl(url);
      expect(path).toBe('users/123/avatar.jpg');
    });

    it('should extract path from Google Cloud Storage URL', () => {
      const url = 'https://storage.googleapis.com/my-bucket/users/123/avatar.jpg';
      const path = extractPathFromUrl(url);
      expect(path).toBe('users/123/avatar.jpg');
    });

    it('should return null for invalid URLs', () => {
      expect(extractPathFromUrl('https://google.com')).toBe(null);
      expect(extractPathFromUrl('invalid-string')).toBe(null);
    });
  });
});
