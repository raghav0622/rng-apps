import { getCurrentUser } from '@/features/auth/session';
import { orgRepository } from '@/features/org/org.repository';
import { Box, Typography } from '@mui/material';
import { redirect } from 'next/navigation';
import { OrganizationSettingsForm } from './OrganizationSettingsForm';

export default async function OrgSettingsPage() {
  const user = await getCurrentUser();
  if (!user?.orgId) redirect('/dashboard/onboarding');

  const org = await orgRepository.findById(user.orgId);
  if (!org) return <div>Organization not found</div>;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Organization Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Manage your workspace details.
      </Typography>

      <OrganizationSettingsForm org={org} />
    </Box>
  );
}
