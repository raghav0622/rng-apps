'use client';

import { useRNGServerAction } from '@/lib/use-rng-action';
import { LoadingSpinner } from '@/ui/LoadingSpinner';
import { Delete, Laptop, Smartphone } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import {
  getSessionsAction,
  revokeAllSessionsAction,
  revokeSessionAction,
} from '../actions/session.actions';
import { Session } from '../auth.model';

interface ActiveSessionsProps {
  currentSessionId?: string; // Optional: Pass from server if available
}

export function ActiveSessions({ currentSessionId }: ActiveSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  // 1. Fetch Action
  const { runAction: fetchSessions, isExecuting: isLoading } = useRNGServerAction(
    getSessionsAction,
    {
      onSuccess: (data) => {
        if (data) setSessions(data);
      },
    },
  );

  // 2. Revoke Single
  const { runAction: revokeSession, isExecuting: isRevoking } = useRNGServerAction(
    //@ts-expect-error ghar ka raj
    revokeSessionAction,
    {
      onSuccess: () => {
        enqueueSnackbar('Session revoked', { variant: 'success' });
        fetchSessions();
      },
    },
  );

  // 3. Revoke All
  const { runAction: revokeAll, isExecuting: isRevokingAll } = useRNGServerAction(
    //@ts-expect-error ghar ka raj
    revokeAllSessionsAction,
    {
      onSuccess: () => {
        enqueueSnackbar('All other sessions signed out', { variant: 'success' });
        window.location.href = '/login'; // Force re-login
      },
    },
  );

  // Initial Fetch
  useEffect(() => {
    fetchSessions();
  }, []);

  // --- Helpers ---
  const getDeviceIcon = (ua: string) => {
    const lower = ua.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone'))
      return <Smartphone />;
    return <Laptop />;
  };

  const getDeviceName = (ua: string) => {
    if (ua.includes('Macintosh')) return 'Mac OS';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown Device';
  };

  return (
    <Card>
      <CardHeader
        title="Active Sessions"
        subheader="Manage devices logged into your account"
        action={
          sessions.length > 1 && (
            <Button
              color="error"
              size="small"
              variant="outlined"
              onClick={() => {
                if (window.confirm('Sign out of all devices? You will be redirected to login.')) {
                  revokeAll();
                }
              }}
              disabled={isRevokingAll}
            >
              Log out all devices
            </Button>
          )
        }
      />
      <CardContent>
        {isLoading && sessions.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <List>
            {sessions.map((session) => {
              const isCurrent = session.sessionId === currentSessionId;

              // If we don't have currentSessionId prop, we can try to infer
              // (weak inference) or just not show the "Current" badge.

              return (
                <ListItem
                  key={session.sessionId}
                  divider
                  secondaryAction={
                    !isCurrent && (
                      <Tooltip title="Revoke Session">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => revokeSession({ sessionId: session.sessionId })}
                          disabled={isRevoking}
                        >
                          <Delete color="action" />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.light' }}>
                      {getDeviceIcon(session.userAgent || '')}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2">
                          {getDeviceName(session.userAgent || '')}
                        </Typography>
                        {isCurrent && (
                          <Chip
                            label="Current Device"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    }
                    secondary={
                      <Box component="span" display="block">
                        <Typography variant="caption" display="block">
                          IP: {session.ip}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last Active:{' '}
                          {new Date(session.createdAt._seconds * 1000).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}

            {sessions.length === 0 && !isLoading && (
              <Alert severity="info">
                No active sessions found (This should not happen if you are logged in).
              </Alert>
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
