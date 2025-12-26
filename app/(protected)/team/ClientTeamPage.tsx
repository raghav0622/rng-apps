'use client';

import { InviteMemberModal } from '@/core/organization/components/InviteMemberModal';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { ReactNode, useState } from 'react';

export default function ClientTeamPageWrapper({
  children,
  orgId,
}: {
  children: ReactNode;
  orgId: string;
}) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsInviteOpen(true)}>
        Invite Member
      </Button>

      {children}

      <InviteMemberModal open={isInviteOpen} onClose={() => setIsInviteOpen(false)} orgId={orgId} />
    </>
  );
}
