'use client';

import * as React from 'react';
import { Box, Typography, Stack, alpha } from '@mui/material';

/**
 * 🎨 RNGTelemetryOverlay
 * A diagnostic overlay for developers/power users showing real-time performance metrics.
 * Note: Actual metrics collection logic would be hooked in separately.
 */
export function RNGTelemetryOverlay() {
  const [metrics, setMetrics] = React.useState({ fps: 60, latency: 45, memory: 120 });

  // Simulate metrics update
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        fps: Math.floor(55 + Math.random() * 5),
        latency: Math.floor(40 + Math.random() * 20),
        memory: Math.floor(110 + Math.random() * 20),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(8px)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.5,
        boxShadow: 4,
        pointerEvents: 'none',
      }}
    >
      <Stack direction="row" spacing={2}>
        <MetricItem label="FPS" value={metrics.fps} color="success.main" />
        <MetricItem label="API (ms)" value={metrics.latency} color="warning.main" />
        <MetricItem label="RAM (MB)" value={metrics.memory} color="info.main" />
      </Stack>
    </Box>
  );
}

function MetricItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box>
      <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ color, fontFamily: 'monospace' }}>
        {value}
      </Typography>
    </Box>
  );
}
