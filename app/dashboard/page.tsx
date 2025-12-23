'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { CreateOrganizationForm } from '@/features/orgs/components/CreateOrganizationForm';
import { MyInvites } from '@/features/orgs/components/MyInvites';
import { Business as BusinessIcon, People as PeopleIcon } from '@mui/icons-material';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';

export default function DashboardPage() {
  const { user } = useRNGAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>

      {/* 1. Always show Pending Invites at the top */}
      {!user?.onboarded && !user?.orgId && <MyInvites />}

      {/* 2. Switch View based on Membership */}
      {!user?.onboarded && !user?.orgId ? (
        <Box mt={4}>
          <CreateOrganizationForm />
        </Box>
      ) : (
        <Grid container spacing={3} mt={2}>
          {/* ORG DASHBOARD (Placeholder Stats) */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <BusinessIcon color="primary" fontSize="large" />
              <Box>
                <Typography variant="h6">Organization</Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Plan: Free
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <PeopleIcon color="secondary" fontSize="large" />
              <Box>
                <Typography variant="h6">Team Members</Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your team
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
