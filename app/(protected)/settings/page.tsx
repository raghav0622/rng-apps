import { userRepository } from '@/core/auth/repositories/user.repository';
import { SettingsForm } from '@/core/org/components/SettingsForm';
import { settingsService } from '@/core/org/services/settings.service';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { Box, Typography } from '@mui/material';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) redirect('/login');

  const decoded = await auth()
    .verifySessionCookie(sessionCookie, true)
    .catch(() => null);
  if (!decoded) redirect('/login');

  const user = await userRepository.get(decoded.uid);
  if (!user || !user.orgId) redirect('/onboarding');

  const result = await settingsService.getSettings(user.orgId);
  if (!result.success) return <Typography color="error">Failed to load settings</Typography>;

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
      <SettingsForm initialData={result.data} />
    </Box>
  );
}
