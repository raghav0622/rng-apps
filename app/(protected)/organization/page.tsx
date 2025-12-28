'use client';

import { useRNGAuth } from '@/core/auth/auth.context';
import { NotificationSettings } from '@/core/notifications/components/NotificationSettings';
import { AppPermission, hasPermission, UserRoleInOrg } from '@/lib/action-policies';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AppContent from '../AppContent';
import BillingPageContent from './_components/BillingContent';
import SettingsPageContent from './_components/SettingsContent';
import TeamPageContent from './_components/TeamContent';

enum OrgTab {
  TEAM = 'team',
  SETTINGS = 'settings',
  BILLING = 'billing',
  NOTIFICATIONS = 'notifications',
}

export default function OrganizationPage() {
  const { user } = useRNGAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeTab = (searchParams.get('tab') as OrgTab) || OrgTab.TEAM;

  const handleTabChange = (event: React.SyntheticEvent, newValue: OrgTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', newValue);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!user) return null;

  const userRole = user.orgRole as UserRoleInOrg;

  const canViewTeam = hasPermission(userRole, AppPermission.MEMBER_VIEW);
  const canViewSettings =
    hasPermission(userRole, AppPermission.ORG_UPDATE) ||
    hasPermission(userRole, AppPermission.ORG_VIEW_SETTINGS);
  const canViewBilling = hasPermission(userRole, AppPermission.BILLING_VIEW);

  return (
    <AppContent>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Organization
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Manage your team, settings, and billing in one place.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="organization tabs">
          {canViewTeam && <Tab label="Team Members" value={OrgTab.TEAM} />}
          {canViewSettings && <Tab label="Settings" value={OrgTab.SETTINGS} />}
          {canViewBilling && <Tab label="Billing" value={OrgTab.BILLING} />}
          <Tab label="Notifications" value={OrgTab.NOTIFICATIONS} />
        </Tabs>
      </Box>

      <Box>
        {activeTab === OrgTab.TEAM && canViewTeam && <TeamPageContent />}
        {activeTab === OrgTab.SETTINGS && canViewSettings && <SettingsPageContent />}
        {activeTab === OrgTab.BILLING && canViewBilling && <BillingPageContent />}
        {activeTab === OrgTab.NOTIFICATIONS && (
          <Box>
             <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Notification Preferences
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Control how and when you receive alerts for organization activity.
              </Typography>
            </Box>
            <NotificationSettings />
          </Box>
        )}
      </Box>
    </AppContent>
  );
}
