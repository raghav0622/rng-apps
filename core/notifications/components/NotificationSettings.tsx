'use client';

import {
  getPreferencesAction,
  updatePreferencesAction,
} from '@/core/notifications/notification.actions';
import {
  NotificationChannel,
  NotificationPreferences,
  NotificationTopic,
} from '@/core/notifications/notification.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

const TOPIC_LABELS: Record<NotificationTopic, string> = {
  [NotificationTopic.SECURITY]: 'Security Alerts',
  [NotificationTopic.BILLING]: 'Billing & Payments',
  [NotificationTopic.TEAM]: 'Team Activity',
  [NotificationTopic.SYSTEM]: 'System Announcements',
};

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const { runAction: fetchPreferences, isExecuting: isLoading } = useRNGServerAction(getPreferencesAction, {
    onSuccess: (data: any) => setPreferences(data),
  });

  const { runAction: updatePreferences } = useRNGServerAction(updatePreferencesAction, {
    // Silently update in background
  });

  useEffect(() => {
    fetchPreferences(undefined);
  }, []);

  const handleToggle = async (topic: NotificationTopic, channel: NotificationChannel) => {
    if (!preferences) return;

    const currentChannels = preferences.channels[topic] || [];
    const isEnabled = currentChannels.includes(channel);

    let newChannels;
    if (isEnabled) {
      newChannels = currentChannels.filter((c) => c !== channel);
    } else {
      newChannels = [...currentChannels, channel];
    }

    // Local Optimistic Update
    setPreferences({
      ...preferences,
      channels: {
        ...preferences.channels,
        [topic]: newChannels,
      },
    });

    // Server Update
    await updatePreferences({ topic, channels: newChannels });
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
       <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notification Channels
          </Typography>
        </Box>
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Topic</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>In-App</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && !preferences ? (
                [...Array(4)].map((_, i) => (
                   <TableRow key={i}>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell align="center"><Skeleton variant="circular" width={24} height={24} sx={{ mx: 'auto' }} /></TableCell>
                    <TableCell align="center"><Skeleton variant="circular" width={24} height={24} sx={{ mx: 'auto' }} /></TableCell>
                   </TableRow>
                ))
              ) : (
                Object.values(NotificationTopic).map((topic) => (
                  <TableRow key={topic} hover>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" fontWeight={500}>{TOPIC_LABELS[topic]}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Notifications for {TOPIC_LABELS[topic].toLowerCase()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        size="small"
                        checked={preferences?.channels[topic]?.includes(NotificationChannel.IN_APP) ?? true}
                        onChange={() => handleToggle(topic, NotificationChannel.IN_APP)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        size="small"
                        checked={preferences?.channels[topic]?.includes(NotificationChannel.EMAIL) ?? false}
                        onChange={() => handleToggle(topic, NotificationChannel.EMAIL)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
