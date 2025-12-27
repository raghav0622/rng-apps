'use client';

import {
  createCheckoutSessionAction,
  createPortalSessionAction,
} from '@/core/billing/billing.actions';
import { getSubscriptionAction } from '@/core/organization/organization.actions'; // Reusing existing fetcher
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@/core/billing/billing.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { useOrg } from '@/core/organization/organization.context';
import { Check as CheckIcon, CreditCard as CardIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

const PLANS = [
  {
    id: SubscriptionPlan.FREE,
    name: 'Free',
    price: '$0',
    features: ['5 Seats', 'Basic Support', '7 Day History'],
  },
  {
    id: SubscriptionPlan.PRO,
    name: 'Pro',
    price: '$29',
    features: ['10 Seats', 'Priority Support', 'Unlimited History', 'Audit Logs'],
  },
  {
    id: SubscriptionPlan.ENTERPRISE,
    name: 'Enterprise',
    price: 'Contact Us',
    features: ['50+ Seats', 'Dedicated Manager', 'SAML SSO', 'SLA'],
  },
];

export default function BillingPage() {
  const { org } = useOrg();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const { runAction: fetchSub } = useRNGServerAction(getSubscriptionAction, {
    onSuccess: (data) => setSubscription(data),
  });

  const { runAction: checkout, isExecuting: isCheckingOut } = useRNGServerAction(
    createCheckoutSessionAction,
    {
      onSuccess: ({ url }) => window.location.assign(url), // Redirect to Stripe
    },
  );

  const { runAction: portal, isExecuting: isPortaling } = useRNGServerAction(
    createPortalSessionAction,
    {
      onSuccess: ({ url }) => window.location.assign(url), // Redirect to Portal
    },
  );

  useEffect(() => {
    fetchSub(undefined);
  }, []);

  if (!org || !subscription) return <Typography>Loading billing...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Billing & Plans
        </Typography>
        <Typography color="text.secondary">
          Manage your subscription and payment methods.
        </Typography>
      </Box>

      {/* Current Plan Dashboard */}
      <Card variant="outlined" sx={{ mb: 6, bgcolor: 'primary.50' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                CURRENT PLAN
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2} mt={1}>
                <Typography variant="h3" fontWeight="bold">
                  {PLANS.find((p) => p.id === subscription.planId)?.name}
                </Typography>
                <Chip
                  label={subscription.status.toUpperCase()}
                  color={subscription.status === 'active' ? 'success' : 'warning'}
                  size="small"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </Typography>
            </Box>

            <Box mt={{ xs: 3, sm: 0 }}>
              {subscription.customerId ? (
                <Button
                  variant="contained"
                  startIcon={<CardIcon />}
                  onClick={() => portal({})}
                  disabled={isPortaling}
                >
                  Manage Billing
                </Button>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No payment method attached.
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Grid container spacing={4}>
        {PLANS.map((plan) => {
          const isCurrent = subscription.planId === plan.id;
          return (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderColor: isCurrent ? 'primary.main' : 'divider',
                  boxShadow: isCurrent ? 4 : 0,
                }}
              >
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mb={3}>
                    {plan.price}
                    <Typography component="span" variant="body1" color="text.secondary">
                      /mo
                    </Typography>
                  </Typography>

                  <Stack spacing={2} mb={4} flexGrow={1}>
                    {plan.features.map((feature) => (
                      <Stack direction="row" spacing={1} alignItems="center" key={feature}>
                        <CheckIcon color="primary" fontSize="small" />
                        <Typography variant="body2">{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Button
                    variant={isCurrent ? 'outlined' : 'contained'}
                    fullWidth
                    disabled={isCurrent || isCheckingOut}
                    onClick={() => checkout({ planId: plan.id })}
                  >
                    {isCurrent ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
