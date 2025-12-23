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
import { SessionDb } from '../auth.model';

interface ActiveSessionsProps {
  currentSessionId?: string;
}

export function ActiveSessions({ currentSessionId }: ActiveSessionsProps) {
  const [sessions, setSessions] = useState<SessionDb[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  // 1. Fetch Sessions
  const { runAction: fetchSessions, isExecuting: isLoading } = useRNGServerAction(
    getSessionsAction,
    {
      onSuccess: (data) => {
        if (data) setSessions(data);
      },
      errorMessage: 'Failed to load active sessions',
    },
  );

  // 2. Revoke Single Session
  const { runAction: revokeSession, isExecuting: isRevoking } = useRNGServerAction(
    revokeSessionAction,
    {
      onSuccess: () => {
        enqueueSnackbar('Session revoked successfully', { variant: 'success' });
        fetchSessions(); // Refresh list to remove the deleted item
      },
      errorMessage: 'Failed to revoke session',
    },
  );

  // 3. Revoke All Sessions
  const { runAction: revokeAll, isExecuting: isRevokingAll } = useRNGServerAction(
    revokeAllSessionsAction,
    {
      onSuccess: () => {
        enqueueSnackbar('All other sessions have been signed out', { variant: 'success' });
        // Optional: Redirect to login if the current session was also killed (backend dependent)
        // window.location.href = '/login';
        fetchSessions();
      },
      errorMessage: 'Failed to sign out all devices',
    },
  );

  // Initial Fetch
  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Helpers ---
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
                    !isCurrent && (
                      <Tooltip title="Revoke access">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => revokeSession({ sessionId: session.sessionId })}
                          disabled={isRevoking}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
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
                            label="Current Device"
                            color="success"
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
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
                          {/* CRITICAL FIX: 
                             We expect 'createdAt' to be a number (milliseconds) now.
                             Firestore Timestamp conversion happens in the repository layer.
                          */}
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
