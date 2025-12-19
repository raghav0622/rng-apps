// __mocks__/notistack.ts
import { vi } from 'vitest';

export const enqueueSnackbar = vi.fn();
export const closeSnackbar = vi.fn();

export const useSnackbar = vi.fn(() => ({
  enqueueSnackbar,
  closeSnackbar,
}));
