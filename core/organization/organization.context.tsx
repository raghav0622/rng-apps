'use client';

import { Organization } from '@/core/organization/organization.model';
import { createContext, ReactNode, useContext } from 'react';

type OrgContextType = {
  org: Organization | null;
  isLoading: boolean;
};

const OrgContext = createContext<OrgContextType>({
  org: null,
  isLoading: true,
});

export const useOrg = () => useContext(OrgContext);

export function OrgProvider({ org, children }: { org: Organization | null; children: ReactNode }) {
  return <OrgContext.Provider value={{ org, isLoading: false }}>{children}</OrgContext.Provider>;
}
