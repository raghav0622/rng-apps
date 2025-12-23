'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { useRNGServerAction } from '@/lib/use-rng-action';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getOrganizationAction } from '../actions/org.actions';
import { Organization } from '../org.model';

type OrgContextType = {
  org: Organization | null;
  isLoading: boolean;
  refreshOrg: () => Promise<Organization | null>;
};

const OrgContext = createContext<OrgContextType>({
  org: null,
  isLoading: true,
  refreshOrg: async () => null,
});

export const useOrg = () => useContext(OrgContext);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useRNGAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hook into your standard server action system

  //@ts-expect-error yolo
  const { execute: fetchOrg } = useRNGServerAction(getOrganizationAction, {
    onSuccess: (result) => {
      if (result) {
        setOrg(result);
      }
      setIsLoading(false);
    },
    onError: () => setIsLoading(false),
  });

  const refreshOrg = async (): Promise<Organization | null> => {
    setIsLoading(true);
    const result = await fetchOrg();
    const updatedOrg = result || null;
    if (updatedOrg) setOrg(updatedOrg);
    return updatedOrg;
  };

  // Sync org data whenever the authenticated user's orgId changes
  useEffect(() => {
    if (user?.orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshOrg();
    } else {
      setOrg(null);
      setIsLoading(false);
    }
  }, [user?.orgId]);

  return (
    <OrgContext.Provider value={{ org, isLoading, refreshOrg }}>{children}</OrgContext.Provider>
  );
}
