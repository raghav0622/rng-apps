'use client';

import { AppPermission, hasPermission, UserRoleInOrg } from '@/core/action-policies';
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
import { defineForm, RNGForm } from '@/rng-form';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export default function SettingsPageContent() {
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

  const isPendingOwner = org.pendingOwnerId === user.id;

  const settingsUiSchema = defineForm<typeof UpdateOrgSchema>((f) => [
    f.text('name', {
      label: 'Organization Name',
      placeholder: 'Enter organization name',
    }),
  ]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Organization Settings
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Manage your organization&apos;s profile, governance, and activity history.
        </Typography>
      </Box>

      <Grid container spacing={4}>
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

        {(canTransferOwnership || isPendingOwner) && (
          <Grid size={{ xs: 12 }}>
            <TransferOwnership org={org} members={members} currentUserId={user.id} />
          </Grid>
        )}

        {canViewAuditLogs && (
          <Grid size={{ xs: 12 }}>
            <AuditLogViewer />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
