'use client';

import { InviteMemberModal } from '@/core/organization/components/InviteMemberModal';
import { ReactNode } from 'react';

export default function ClientTeamPageWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      {children}

      <InviteMemberModal />
    </>
  );
}
