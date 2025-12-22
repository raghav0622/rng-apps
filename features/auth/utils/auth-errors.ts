export const mapAuthError = (
  code: string,
  defaultMessage: string = 'An unexpected error occurred.',
): string => {
  switch (code) {
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/user-not-found':
      return 'Account not found. Please sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'Email is already registered. Please login.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return defaultMessage;
  }
};
