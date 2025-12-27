'use client';

import { AuditLogViewer } from '@/core/audit/components/AuditLogViewer';
import { TransferOwnership } from '@/core/organization/components/TransferOwnership';
import { getMembersAction } from '@/core/organization/organization.actions'; // Need members for transfer list
import { useOrg } from '@/core/organization/organization.context';
import { useRNGAuth } from '@/core/auth/auth.context';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { Box, Container, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Member } from '@/core/organization/organization.model';

export default function SettingsPage() {
  const { org } = useOrg();
  const { user } = useRNGAuth();
  const [members, setMembers] = useState<Member[]>([]);

  // Fetch members for the transfer dropdown
  const { runAction } = useRNGServerAction(getMembersAction, {
    onSuccess: (data) => setMembers(data),
  });

  useEffect(() => {
    runAction(undefined);
  }, []);

  if (!org || !user) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Organization Settings
        </Typography>
        <Typography color="text.secondary">
          Manage your organization profile and configuration.
        </Typography>
      </Box>

      <Box mb={6}>
        <TransferOwnership org={org} members={members} currentUserId={user.id} />
      </Box>

      {/* Audit Logs */}
      <AuditLogViewer />
    </Container>
  );
}
