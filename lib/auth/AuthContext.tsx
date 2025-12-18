'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SessionUser } from './session';

// Re-export specific types if needed
export type { SessionUser };

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  setUser: (user: SessionUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(false);

  // Update state if the server prop changes (e.g. on navigation/refresh)
  useEffect(() => {
    if (initialUser !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(initialUser);
    }
  }, [initialUser]);

  return <AuthContext.Provider value={{ user, loading, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
