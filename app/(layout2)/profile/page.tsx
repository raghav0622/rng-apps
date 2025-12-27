'use client';

import { NotificationSettings } from '@/core/notifications/components/NotificationSettings';
import { SessionManager } from '@/app/(protected)/profile/SessionManager';
import { Box, Container, Typography } from '@mui/material';

export default function ProfilePage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Account Settings
        </Typography>
        <Typography color="text.secondary">
          Manage your profile and security preferences.
        </Typography>
      </Box>

      {/* Placeholder for Profile Form (Name, Avatar) */}
      <Box mb={6}>
        <Typography variant="h6" gutterBottom>
          Profile Details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          (Profile Update Form Coming Soon)
        </Typography>
      </Box>

      {/* Notification Preferences */}
      <Box mb={6}>
        <NotificationSettings />
      </Box>

      {/* Session Management */}
      <Box>
        <SessionManager />
      </Box>
    </Container>
  );
}
