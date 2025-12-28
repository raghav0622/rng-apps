'use client';

import {
  deleteAllNotificationsAction,
  deleteNotificationAction,
  getNotificationsAction,
  markAllReadAction,
  markReadAction,
} from '@/core/notifications/notification.actions';
import { Notification, NotificationType } from '@/core/notifications/notification.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { Result } from '@/lib/types';
import {
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Notifications as BellIcon,
  Warning as WarningIcon,
  DeleteOutline as DeleteIcon,
  DeleteSweep as ClearAllIcon,
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

interface NotificationData {
  list: Notification[];
  unreadCount: number;
}

export function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { runAction: fetchNotifications } = useRNGServerAction(getNotificationsAction, {
    onSuccess: (data: any) => {
      // Data is wrapped in { success: true, data: { list, unreadCount } } by the action
      if (data && data.list) {
        setNotifications(data.list);
        setUnreadCount(data.unreadCount);
      }
    },
  });

  const { runAction: markRead } = useRNGServerAction(markReadAction, {
    onSuccess: () => fetchNotifications(undefined),
  });

  const { runAction: markAllRead } = useRNGServerAction(markAllReadAction, {
    onSuccess: () => fetchNotifications(undefined),
  });

  const { runAction: deleteNotif } = useRNGServerAction(deleteNotificationAction, {
    onSuccess: () => fetchNotifications(undefined),
  });

  const { runAction: deleteAll } = useRNGServerAction(deleteAllNotificationsAction, {
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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotif({ notificationId: id });
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
          sx: { width: 380, maxHeight: 500 },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
          <Stack direction="row" spacing={1}>
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={() => markAllRead(undefined)}>
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {notifications.length > 0 && (
              <Tooltip title="Clear all">
                <IconButton size="small" color="error" onClick={() => {
                  if(confirm('Clear all notifications?')) deleteAll(undefined);
                }}>
                  <ClearAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
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
                  '&:hover .delete-notif-btn': { opacity: 1 }
                }}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    size="small" 
                    className="delete-notif-btn"
                    sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                    onClick={(e) => handleDelete(n.id, e)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemButton
                  onClick={() => !n.isRead && markRead({ notificationId: n.id })}
                  alignItems="flex-start"
                  sx={{ pr: 6 }}
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
