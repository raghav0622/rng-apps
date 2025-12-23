'use client';

import {
  getSessionsAction,
  revokeAllSessionsAction,
  revokeSessionAction,
} from '@/features/auth/actions/session.actions'; // Ensure correct import path
import { SessionDb } from '@/features/auth/auth.model';
import { AppErrorCode } from '@/lib/errors';
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

export function ActiveSessions() {
  const [sessions, setSessions] = useState<SessionDb[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  // 1. Fetch Sessions (Updated to handle object return)
  const { runAction: fetchSessions, isExecuting: isLoading } = useRNGServerAction(
    //@ts-expect-error yolo
    getSessionsAction,
    {
      onSuccess: (data) => {
        if (data) {
          setSessions(data.sessions);
          setCurrentSessionId(data.currentSessionId);
        }
      },
      // CRITICAL FIX: If fetching sessions fails due to auth (revoked), redirect immediately
      onError: (msg, code) => {
        if (code === AppErrorCode.UNAUTHENTICATED) {
          window.location.href = '/login?reason=session_revoked';
        } else {
          enqueueSnackbar('Failed to load active sessions', { variant: 'error' });
        }
      },
    },
  );

  // 2. Revoke Single Session
  const { runAction: revokeSession, isExecuting: isRevoking } = useRNGServerAction(
    //@ts-expect-error yolo
    revokeSessionAction,
    {
      onSuccess: (data) => {
        if (data?.isCurrent) {
          enqueueSnackbar('Session ended. Redirecting...', { variant: 'info' });
          window.location.href = '/login';
        } else {
          enqueueSnackbar('Session revoked successfully', { variant: 'success' });
          fetchSessions();
        }
      },
      errorMessage: 'Failed to revoke session',
    },
  );

  // 3. Revoke All Sessions
  const { runAction: revokeAll, isExecuting: isRevokingAll } = useRNGServerAction(
    //@ts-expect-error yolo
    revokeAllSessionsAction,
    {
      onSuccess: () => {
        enqueueSnackbar('Signed out all devices', { variant: 'success' });
        window.location.href = '/login';
      },
      errorMessage: 'Failed to sign out all devices',
    },
  );

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDeviceIcon = (ua: string = '') => {
    const lower = ua.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone'))
      return <Smartphone />;
    return <Laptop />;
  };

  const getDeviceName = (ua: string = '') => {
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
        subheader="Manage devices currently logged into your account"
        action={
          sessions.length > 1 && (
            <Button
              color="error"
              size="small"
              variant="outlined"
              onClick={() => {
                if (window.confirm('Are you sure you want to sign out of all devices?')) {
                  revokeAll();
                }
              }}
              disabled={isRevokingAll || isLoading}
            >
              Sign Out All Devices
            </Button>
          )
        }
      />
      <CardContent>
        {isLoading && sessions.length === 0 ? (
          <LoadingSpinner message="Loading sessions..." />
        ) : (
          <List disablePadding>
            {sessions.map((session) => {
              const isCurrent = session.sessionId === currentSessionId;

              return (
                <ListItem
                  key={session.sessionId}
                  divider
                  secondaryAction={
                    <Tooltip title={isCurrent ? 'Sign out' : 'Revoke access'}>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          if (isCurrent && !window.confirm('This will log you out. Continue?'))
                            return;
                          revokeSession({ sessionId: session.sessionId });
                        }}
                        disabled={isRevoking || isRevokingAll}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: isCurrent ? 'success.light' : 'primary.light',
                        color: 'primary.contrastText',
                      }}
                    >
                      {getDeviceIcon(session.userAgent)}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" component="span">
                          {getDeviceName(session.userAgent)}
                        </Typography>
                        {isCurrent && (
                          <Chip
                            label="Current Session"
                            color="success"
                            size="small"
                            variant="filled"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                          />
                        )}
                      </Stack>
                    }
                    secondary={
                      <Box component="span" display="block">
                        <Typography variant="caption" display="block" color="text.secondary">
                          IP: {session.ip || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Last Active: {new Date(session.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}

            {sessions.length === 0 && !isLoading && (
              <Alert severity="info" variant="outlined">
                No active sessions found.
              </Alert>
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
