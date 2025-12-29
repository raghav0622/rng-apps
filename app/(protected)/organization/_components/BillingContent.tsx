'use client';

import {
  createCheckoutSessionAction,
  createPortalSessionAction,
} from '@/core/billing/billing.actions';
import { Subscription, SubscriptionPlan } from '@/core/billing/billing.model';
import { getSubscriptionAction } from '@/core/organization/organization.actions';
import { useOrg } from '@/core/organization/organization.context';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { CreditCard as CardIcon, Check as CheckIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

const isProduction = process.env.NODE_ENV === 'production';

const PLANS = [
  {
    id: SubscriptionPlan.FREE,
    name: 'Free',
    price: '$0',
    description: 'Perfect for small teams getting started.',
    features: ['5 Seats', 'Basic Support', '7 Day Activity History'],
  },
  {
    id: SubscriptionPlan.PRO,
    name: 'Pro',
    price: '$29',
    description: 'Advanced features for growing organizations.',
    features: ['10 Seats', 'Priority Support', 'Unlimited Activity History', 'Advanced Audit Logs'],
  },
  {
    id: SubscriptionPlan.ENTERPRISE,
    name: 'Enterprise',
    price: 'Custom',
    description: 'Security and scale for large enterprises.',
    features: ['Unlimited Seats', 'Dedicated Account Manager', 'SAML SSO & SCIM', 'Custom SLA'],
  },
];

export default function BillingPageContent() {
  const { org } = useOrg();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const { runAction: fetchSub, isExecuting: isFetching } = useRNGServerAction(
    getSubscriptionAction,
    {
      onSuccess: (data: any) => setSubscription(data),
    },
  );

  const { runAction: checkout, isExecuting: isCheckingOut } = useRNGServerAction(
    createCheckoutSessionAction,
    {
      onSuccess: (data: any) => {
        if (data?.url) window.location.assign(data.url);
      },
    },
  );

  const { runAction: portal, isExecuting: isPortaling } = useRNGServerAction(
    createPortalSessionAction,
    {
      onSuccess: (data: any) => {
        if (data?.url) window.location.assign(data.url);
      },
    },
  );

  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    fetchSub(undefined);
  }, []);

  if (!org) return null;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Billing & Plans
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Manage your organization&apos;s subscription, payment methods, and billing history.
        </Typography>
      </Box>

      {/* Current Plan Overview */}
      <Card variant="outlined" sx={{ mb: 6, borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            CURRENT SUBSCRIPTION
          </Typography>
        </Box>
        <CardContent sx={{ p: 4 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Box>
              {isFetching && !subscription ? (
                <Skeleton width={200} height={40} />
              ) : (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="h3" fontWeight={800}>
                    {PLANS.find((p) => p.id === subscription?.planId)?.name || 'Free'}
                  </Typography>
                  <Chip
                    label={subscription?.status?.toUpperCase() || 'ACTIVE'}
                    color={subscription?.status === 'active' ? 'success' : 'primary'}
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subscription?.cancelAtPeriodEnd
                  ? `Your plan will end on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : `Next billing date: ${subscription ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}`}
              </Typography>
            </Box>

            <Box>
              {subscription?.customerId ? (
                <Button
                  variant="contained"
                  startIcon={<CardIcon />}
                  onClick={() => portal({})}
                  disabled={isPortaling}
                  size="large"
                >
                  Manage Payment Methods
                </Button>
              ) : (
                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    No payment method on file.
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    Upgrade to Pro for more features.
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 4 }}>
        Available Plans
      </Typography>

      <Grid container spacing={4}>
        {PLANS.map((plan) => {
          const isCurrent = subscription?.planId === plan.id;
          const isPro = plan.id === SubscriptionPlan.PRO;

          const showUpgrade = !isProduction || plan.id === SubscriptionPlan.FREE;

          return (
            <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  position: 'relative',
                  borderColor: isCurrent ? 'primary.main' : 'divider',
                  borderWidth: isCurrent ? 2 : 1,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                  opacity: !showUpgrade && !isCurrent ? 0.7 : 1,
                }}
              >
                <CardContent
                  sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Typography component="span" variant="h3" fontWeight={800}>
                      {plan.price}
                    </Typography>
                    {plan.price !== 'Custom' && (
                      <Typography
                        component="span"
                        variant="h6"
                        color="text.secondary"
                        sx={{ ml: 0.5 }}
                      >
                        /mo
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ mb: 4 }} />

                  <Stack spacing={2} sx={{ mb: 4, flexGrow: 1 }}>
                    {plan.features.map((feature) => (
                      <Stack direction="row" spacing={1.5} alignItems="flex-start" key={feature}>
                        <CheckIcon color="primary" sx={{ fontSize: 18, mt: 0.3 }} />
                        <Typography variant="body2" fontWeight={500}>
                          {feature}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Button
                    variant={isCurrent ? 'outlined' : 'contained'}
                    fullWidth
                    disabled={isCurrent || isCheckingOut || (!showUpgrade && !isCurrent)}
                    onClick={() => enqueueSnackbar('Coming Soon!', { variant: 'info' })}
                    size="large"
                    sx={{ borderRadius: 2 }}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : !showUpgrade
                        ? 'Coming Soon'
                        : plan.price === 'Custom'
                          ? 'Contact Sales'
                          : 'Upgrade Now'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
