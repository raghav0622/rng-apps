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
  FormControlLabel,
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

  const { runAction: fetchPreferences } = useRNGServerAction(getPreferencesAction, {
    onSuccess: (data) => setPreferences(data),
  });

  const { runAction: updatePreferences } = useRNGServerAction(updatePreferencesAction, {
    // Optimistic update logic could go here, for now simpler to just rely on re-fetch or local state
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

    // Local Update
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

  if (!preferences) return <Typography>Loading settings...</Typography>;

  return (
    <Card variant="outlined">
      <CardContent>
        <Box mb={3}>
          <Typography variant="h6">Notification Preferences</Typography>
          <Typography variant="body2" color="text.secondary">
            Control how and when you receive alerts.
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Topic</TableCell>
                <TableCell align="center">In-App</TableCell>
                <TableCell align="center">Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(NotificationTopic).map((topic) => (
                <TableRow key={topic}>
                  <TableCell component="th" scope="row">
                    <Typography variant="subtitle2">{TOPIC_LABELS[topic]}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={preferences.channels[topic]?.includes(
                            NotificationChannel.IN_APP,
                          )}
                          onChange={() => handleToggle(topic, NotificationChannel.IN_APP)}
                          // Usually force In-App for critical stuff, but allowing toggle for demo
                        />
                      }
                      label=""
                    />
                  </TableCell>
                  <TableCell align="center">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={preferences.channels[topic]?.includes(
                            NotificationChannel.EMAIL,
                          )}
                          onChange={() => handleToggle(topic, NotificationChannel.EMAIL)}
                        />
                      }
                      label=""
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
