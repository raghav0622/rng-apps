'use client';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, Grid, IconButton, Paper, Tooltip, Typography, useTheme } from '@mui/material';
import { ReactNode } from 'react';

export interface DescriptionItem {
  key: string;
  label: string;
  value: ReactNode;
  /**
   * If true, shows a copy button next to the value.
   */
  copyable?: boolean;
  /**
   * Number of grid columns this item should span.
   * @default 1
   */
  span?: number;
}

interface RNGDescriptionListProps {
  items: DescriptionItem[];
  /**
   * Number of columns in the grid.
   * @default 3
   */
  columns?: number;
  /**
   * Optional title for the section.
   */
  title?: string;
}

/**
 * 🎨 RNGDescriptionList
 * A high-density grid for displaying read-only record details.
 * Essential for "Detail Views" in an ERP (e.g. Customer Profile, Invoice Header).
 */
export function RNGDescriptionList({ items, columns = 3, title }: RNGDescriptionListProps) {
  const theme = useTheme();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Ideally trigger a toast here
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
      }}
    >
      {title && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
        </Box>
      )}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3} columns={columns}>
          {items.map((item) => (
            <Grid key={item.key} size={{ xs: columns, sm: item.span || 1 }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mb: 0.5,
                  }}
                >
                  {item.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    fontWeight={500}
                    sx={{ wordBreak: 'break-word' }}
                  >
                    {item.value || '-'}
                  </Typography>
                  {item.copyable && typeof item.value === 'string' && (
                    <Tooltip title="Copy">
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(item.value as string)}
                        sx={{ p: 0.5, color: 'text.disabled' }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
}
