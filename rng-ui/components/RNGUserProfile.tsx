'use client';

import { Avatar, Box, Stack, Typography } from '@mui/material';

interface RNGUserProfileProps {
  displayName?: string;
  email: string;
  photoURL?: string;
  fallbackId: string;
}

export function RNGUserProfile({ displayName, email, photoURL, fallbackId }: RNGUserProfileProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar
        src={photoURL}
        sx={{ width: 24, height: 24, fontSize: '0.75rem', flexShrink: 0 }}
      >
        {displayName?.charAt(0) || email?.charAt(0)}
      </Avatar>
      <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
        <Typography variant="caption" fontWeight={600} display="block" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName || 'Unknown'}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {email}
        </Typography>
      </Box>
    </Stack>
  );
}
