import { userRepository } from '@/core/auth/user.repository';
import { billingService } from '@/core/billing/billing.service';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { Alert, Box, Button, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) redirect('/login');

  const decoded = await auth()
    .verifySessionCookie(sessionCookie, true)
    .catch(() => null);
  if (!decoded) redirect('/login');

  const user = await userRepository.get(decoded.uid);
  if (!user || !user.orgId) redirect('/onboarding');

  // 1. Fetch the result
  const result = await billingService.getSubscription(user.orgId);

  // 2. Handle the error case
  if (!result.success) {
    return (
      <Box p={4}>
        <Alert severity="error">Failed to load subscription details. {result.error.message}</Alert>
      </Box>
    );
  }

  // 3. Extract the actual subscription data
  const subscription = result.data;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Billing & Usage
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Current Plan
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h3" sx={{ textTransform: 'capitalize' }}>
                  {subscription.planId}
                </Typography>
                <Chip
                  label={subscription.status}
                  color={
                    subscription.status === 'active' || subscription.status === 'trialing'
                      ? 'success'
                      : 'warning'
                  }
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Renews on: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            variant="outlined"
            sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Button variant="contained" size="large">
              Manage Subscription (Stripe)
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
