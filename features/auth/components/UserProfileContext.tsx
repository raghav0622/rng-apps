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
  isInitialized: boolean; // Added to track initial fetch completion
  refreshProfile: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [data, setData] = useState<UserProfileData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { executeAsync: fetchProfile, isExecuting } = useAction(getProfileAction, {
    onSuccess: ({ data }) => {
      if (data) {
        setData(data);
      }
      setIsInitialized(true);
    },
    onError: () => {
      setIsInitialized(true); // Mark initialized even on error to stop loading spinners
    },
  });

  const refreshProfile = async () => {
    if (authUser?.uid) {
      await fetchProfile();
    }
  };

  useEffect(() => {
    let mounted = true;

    const initProfile = async () => {
      if (authUser?.uid) {
        // Only fetch if we don't have data matching this user
        if (data?.uid !== authUser.uid) {
          await fetchProfile();
        } else {
          setIsInitialized(true);
        }
      } else {
        setData(null);
        setIsInitialized(true);
      }
    };

    initProfile();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.uid]);

  // Fallback: If no detailed server data yet, use the basic auth user
  const effectiveUser = data || (authUser as UserProfileData | null);

  return (
    <UserProfileContext.Provider
      value={{
        data: effectiveUser,
        isLoading: isExecuting,
        isInitialized,
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
