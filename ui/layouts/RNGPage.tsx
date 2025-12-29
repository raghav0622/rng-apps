'use client';

import { Box, Container, ContainerProps, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

type RNGPageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
} & ContainerProps;

export function RNGPage({ title, description, actions, children, ...rest }: RNGPageProps) {
  return (
    <Container {...rest}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary" variant="body1">
              {description}
            </Typography>
          )}
        </Box>
        {actions && <Box>{actions}</Box>}
      </Box>
      <Stack gap={2}>{children}</Stack>
    </Container>
  );
}
