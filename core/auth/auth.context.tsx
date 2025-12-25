'use client';

import { User } from '@/core/auth/auth.model';
import { createContext, ReactNode, useContext } from 'react';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const useRNGAuth = () => useContext(AuthContext);

export function AuthProvider({ user, children }: { user: User | null; children: ReactNode }) {
  return <AuthContext.Provider value={{ user, isLoading: false }}>{children}</AuthContext.Provider>;
}
