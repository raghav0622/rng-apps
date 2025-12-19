import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

// 1. Mock Next.js Navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// 2. Mock Firebase
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  getAuth: vi.fn(),
}));
vi.mock('@/lib/firebase/client', () => ({
  clientAuth: { signOut: vi.fn() },
}));

// 3. Mock Server Action (hook)
const mockExecuteAsync = vi.fn();
vi.mock('next-safe-action/hooks', () => ({
  useAction: () => ({
    executeAsync: mockExecuteAsync,
    isExecuting: false,
  }),
}));

// 4. Mock Notistack
const mockEnqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login flow', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Fill form
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Mock Firebase Success
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: {
        getIdToken: vi.fn().mockResolvedValue('firebase-id-token'),
      },
    } as any);

    // Mock Server Action Success
    mockExecuteAsync.mockResolvedValue({ data: { success: true } });

    // Submit
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Assertions
    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
      expect(mockExecuteAsync).toHaveBeenCalledWith({ idToken: 'firebase-id-token' });
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Login successful!', expect.any(Object));
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles firebase auth failure', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');

    // Mock Failure
    const error = { code: 'auth/user-not-found', message: 'User not found' };
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(error);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Account not found.',
        expect.objectContaining({ variant: 'error' }),
      );
      expect(mockExecuteAsync).not.toHaveBeenCalled();
    });
  });
});
