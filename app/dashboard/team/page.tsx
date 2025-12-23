import { InviteForm } from '@/features/orgs/components/InviteForm';
import { TeamList } from '@/features/orgs/components/TeamList';
import { Box, Container, Typography } from '@mui/material';

export default function TeamPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Team Management
        </Typography>
        <Typography color="text.secondary">
          Manage your organization members, roles, and pending invitations.
        </Typography>
      </Box>

      {/* Invite Section */}
      <InviteForm />

      {/* Members List */}
      <TeamList />
    </Container>
  );
}
