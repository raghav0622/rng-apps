'use client';

import { getProfileAction } from '@/features/auth/auth.actions';
import { useAction } from 'next-safe-action/hooks';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

type UserProfileData = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

type UserProfileContextType = {
  data: UserProfileData | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth(); // Connects to your existing Auth
  const [data, setData] = useState<UserProfileData | null>(null);

  const { executeAsync: fetchProfile, isExecuting } = useAction(getProfileAction, {
    onSuccess: ({ data }) => {
      if (data) {
        setData(data);
      }
    },
  });

  const refreshProfile = async () => {
    if (authUser?.uid) {
      await fetchProfile();
    }
  };

  // Sync: When Auth User appears, fetch the detailed Profile Data
  useEffect(() => {
    if (authUser?.uid) {
      // Avoid re-fetching if we already have data for this user
      if (data?.uid === authUser.uid) return;
      fetchProfile();
    } else {
      setData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.uid]);

  // Fallback: If no server data yet, use the basic auth user to prevent white flash
  const effectiveUser = data || (authUser as UserProfileData | null);

  return (
    <UserProfileContext.Provider
      value={{
        data: effectiveUser,
        isLoading: isExecuting,
        refreshProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
