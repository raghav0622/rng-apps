'use client';

import { Box, Breadcrumbs, Container, ContainerProps, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { ReactNode } from 'react';

type RNGPageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  // ✅ New Prop
  breadcrumbs?: { label: string; href: string }[];
} & ContainerProps;

export function RNGPage({
  title,
  description,
  actions,
  children,
  breadcrumbs,
  ...rest
}: RNGPageProps) {
  return (
    <Container {...rest} maxWidth={rest.maxWidth || 'xl'}>
      {/* ✅ Breadcrumbs Rendering */}
      {breadcrumbs && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return isLast ? (
              <Typography key={crumb.href} color="text.primary" variant="body2" fontWeight={600}>
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={crumb.href}
                href={crumb.href}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ '&:hover': { textDecoration: 'underline' } }}
                >
                  {crumb.label}
                </Typography>
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Header Section */}
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

      {/* Content */}
      <Stack gap={2}>{children}</Stack>
    </Container>
  );
}
