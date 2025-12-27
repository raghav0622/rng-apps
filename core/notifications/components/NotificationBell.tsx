'use client';

import {
  getNotificationsAction,
  markAllReadAction,
  markReadAction,
} from '@/core/notifications/notification.actions';
import { Notification, NotificationType } from '@/core/notifications/notification.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import {
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Notifications as BellIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

const getIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.SUCCESS:
      return <CheckIcon color="success" fontSize="small" />;
    case NotificationType.WARNING:
      return <WarningIcon color="warning" fontSize="small" />;
    case NotificationType.ERROR:
      return <ErrorIcon color="error" fontSize="small" />;
    default:
      return <InfoIcon color="info" fontSize="small" />;
  }
};

export function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { runAction: fetchNotifications } = useRNGServerAction(getNotificationsAction, {
    onSuccess: (data) => {
      setNotifications(data.list);
      setUnreadCount(data.unreadCount);
    },
  });

  const { runAction: markRead } = useRNGServerAction(markReadAction, {
    onSuccess: () => fetchNotifications(undefined),
  });

  const { runAction: markAllRead } = useRNGServerAction(markAllReadAction, {
    onSuccess: () => fetchNotifications(undefined),
  });

  // Initial Fetch
  useEffect(() => {
    fetchNotifications(undefined);
    
    // Optional: Poll every 60s
    const interval = setInterval(() => fetchNotifications(undefined), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications(undefined); // Refresh on open
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markRead({ notificationId: id });
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={handleClick}>
          <Badge badgeContent={unreadCount} color="error">
            <BellIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 360, maxHeight: 500 },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={() => markAllRead(undefined)}>
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((n) => (
              <ListItem
                key={n.id}
                disablePadding
                sx={{
                  bgcolor: n.isRead ? 'transparent' : 'action.hover',
                }}
              >
                <ListItemButton
                  onClick={() => !n.isRead && markRead({ notificationId: n.id })}
                  alignItems="flex-start"
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    {getIcon(n.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={n.title}
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {n.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(n.createdAt).toLocaleString()}
                        </Typography>
                      </Stack>
                    }
                  />
                  {!n.isRead && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        ml: 1,
                        mt: 1,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
