'use client';

import {
  listSessionsAction,
  revokeAllSessionsAction,
  revokeSessionAction,
} from '@/core/auth/auth.actions';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import {
  CheckCircle as CurrentIcon,
  Laptop as LaptopIcon,
  PhoneAndroid as MobileIcon,
  Delete as RevokeIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';

interface SessionData {
  sessionId: string;
  createdAt: string;
  ip?: string;
  device?: string;
  browser?: string;
  os?: string;
  isCurrent?: boolean;
}

export function SessionManager() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const theme = useTheme();

  const listAction = useRNGServerAction(listSessionsAction, {
    onSuccess: (data) => setSessions(data),
  });

  const revokeAction = useRNGServerAction(revokeSessionAction, {
    successMessage: 'Session revoked',
    onSuccess: () => listAction.runAction(undefined),
  });

  const revokeAllAction = useRNGServerAction(revokeAllSessionsAction, {
    successMessage: 'All other sessions revoked',
    onSuccess: () => listAction.runAction(undefined),
  });

  useEffect(() => {
    listAction.runAction(undefined);
  }, []);

  if (listAction.isExecuting && sessions.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography color="text.secondary">Loading sessions...</Typography>
        </CardContent>
      </Card>
    );
  }

  const getDeviceIcon = (device?: string, os?: string) => {
    if (
      device?.toLowerCase().includes('mobile') ||
      os?.toLowerCase() === 'ios' ||
      os?.toLowerCase() === 'android'
    ) {
      return <MobileIcon />;
    }
    return <LaptopIcon />;
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6">Active Sessions</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage devices where you are currently logged in.
            </Typography>
          </Box>
          {sessions.length > 1 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => revokeAllAction.runAction(undefined)}
              disabled={revokeAllAction.isExecuting}
            >
              Revoke All Others
            </Button>
          )}
        </Box>

        <List disablePadding>
          {sessions.map((session) => (
            <ListItem
              key={session.sessionId}
              divider
              sx={{
                bgcolor: session.isCurrent
                  ? (theme) => theme.palette.action.selected
                  : 'transparent',
                borderRadius: 1,
                mb: 1,
                border: 1,
                borderColor: session.isCurrent ? 'primary.main' : 'transparent',
              }}
              secondaryAction={
                !session.isCurrent && (
                  <Tooltip title="Revoke Session">
                    <IconButton
                      edge="end"
                      aria-label="revoke"
                      onClick={() => revokeAction.runAction({ sessionId: session.sessionId })}
                      disabled={revokeAction.isExecuting}
                      color="error"
                    >
                      <RevokeIcon />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: session.isCurrent ? 'primary.main' : 'action.disabledBackground',
                    color: session.isCurrent ? 'primary.contrastText' : 'text.secondary',
                  }}
                >
                  {getDeviceIcon(session.device, session.os)}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primaryTypographyProps={{ component: 'div' }}
                secondaryTypographyProps={{ component: 'div' }}
                primary={
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {session.browser} on {session.os}
                    </Typography>
                    {session.isCurrent && (
                      <Chip
                        label="This Device"
                        color="primary"
                        size="small"
                        icon={<CurrentIcon fontSize="small" />}
                        sx={{ height: 24 }}
                      />
                    )}
                  </Stack>
                }
                secondary={
                  <Stack direction="column" spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      IP Address: {session.ip}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Signed in: {new Date(session.createdAt).toLocaleString()}
                    </Typography>
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
