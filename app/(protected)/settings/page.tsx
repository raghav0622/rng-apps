'use client';

import { AuditLogViewer } from '@/core/audit/components/AuditLogViewer';
import { useRNGAuth } from '@/core/auth/auth.context';
import { TransferOwnership } from '@/core/organization/components/TransferOwnership';
import {
  getMembersAction,
  updateOrganizationAction,
} from '@/core/organization/organization.actions';
import { useOrg } from '@/core/organization/organization.context';
import { MemberWithProfile, UpdateOrgSchema } from '@/core/organization/organization.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { AppPermission, hasPermission, UserRoleInOrg } from '@/lib/action-policies';
import { defineForm, RNGForm } from '@/rng-form';
import { Box, Card, CardContent, Container, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { org } = useOrg();
  const { user } = useRNGAuth();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);

  const { runAction: fetchMembers } = useRNGServerAction(getMembersAction, {
    onSuccess: (data: any) => setMembers(data as MemberWithProfile[]),
  });

  const { runAction: updateOrg, isExecuting: isUpdating } = useRNGServerAction(
    updateOrganizationAction,
    {
      successMessage: 'Organization updated successfully',
    },
  );

  useEffect(() => {
    fetchMembers(undefined);
  }, []);

  if (!org || !user) return null;

  const userRole = user.orgRole as UserRoleInOrg;
  const canUpdateOrg = hasPermission(userRole, AppPermission.ORG_UPDATE);
  const canTransferOwnership = hasPermission(userRole, AppPermission.ORG_TRANSFER_OWNERSHIP);
  const canViewAuditLogs = hasPermission(userRole, AppPermission.VIEW_AUDIT_LOGS);
  
  // 🛡️ CRITICAL FIX: Ensure the target of an ownership transfer can actually see the UI to accept it.
  const isPendingOwner = org.pendingOwnerId === user.id;

  // Define the UI schema using the DSL
  const settingsUiSchema = defineForm<typeof UpdateOrgSchema>((f) => [
    f.text('name', {
      label: 'Organization Name',
      placeholder: 'Enter organization name',
    }),
  ]);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Organization Settings
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Manage your organization&apos;s profile, governance, and activity history.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Profile Settings */}
        {canUpdateOrg && (
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  General Settings
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <RNGForm
                  schema={UpdateOrgSchema}
                  uiSchema={settingsUiSchema}
                  defaultValues={{ name: org.name }}
                  onSubmit={async (data) => {
                    await updateOrg(data);
                  }}
                  submitLabel="Save Changes"
                  submitingLablel="Saving..."
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Ownership Transfer (Visible to Owner OR the user who needs to accept it) */}
        {(canTransferOwnership || isPendingOwner) && (
          <Grid size={{ xs: 12 }}>
            <TransferOwnership org={org} members={members} currentUserId={user.id} />
          </Grid>
        )}

        {/* Audit Logs */}
        {canViewAuditLogs && (
          <Grid size={{ xs: 12 }}>
            <AuditLogViewer />
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
