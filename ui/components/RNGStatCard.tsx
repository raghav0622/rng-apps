'use client';

import * as React from 'react';
import { Card, CardContent, Typography, Box, Stack, useTheme, styled } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface RNGStatCardProps {
  /**
   * The primary label (e.g. "Total Revenue")
   */
  label: string;
  /**
   * The main value (e.g. "$1,234.56")
   */
  value: string | number;
  /**
   * The percentage change (e.g. 12.5)
   */
  trend?: number;
  /**
   * The direction of the trend.
   * 'neutral' can be used for no change.
   */
  trendDirection?: 'up' | 'down' | 'neutral';
  /**
   * Optional sub-label or comparison text (e.g. "vs last month")
   */
  trendLabel?: string;
  /**
   * Array of numbers for the mini-sparkline (optional)
   */
  sparklineData?: number[];
  /**
   * Icon to display in the corner
   */
  icon?: React.ReactNode;
}

const SparklineSvg = styled('svg')(({ theme }) => ({
  width: '100%',
  height: '100%',
  overflow: 'visible',
  '& path': {
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
  },
}));

/**
 * 🎨 RNGStatCard
 * High-impact metric display with trend indicators and mini-charts.
 */
export function RNGStatCard({
  label,
  value,
  trend,
  trendDirection = 'neutral',
  trendLabel,
  sparklineData,
  icon,
}: RNGStatCardProps) {
  const theme = useTheme();

  // Determine trend color
  let trendColor = theme.palette.text.secondary;
  let TrendIcon = TrendingFlatIcon;

  if (trendDirection === 'up') {
    trendColor = theme.palette.success.main;
    TrendIcon = TrendingUpIcon;
  } else if (trendDirection === 'down') {
    trendColor = theme.palette.error.main;
    TrendIcon = TrendingDownIcon;
  }

  // Generate Sparkline Path
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    
    // Normalize data to 0-100 range for SVG
    const points = sparklineData.map((d, i) => {
      const x = (i / (sparklineData.length - 1)) * 100;
      const y = 100 - ((d - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <Box sx={{ height: 40, width: 80, ml: 2, opacity: 0.8 }}>
        <SparklineSvg viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={`M ${points}`} stroke={trendColor} />
        </SparklineSvg>
      </Box>
    );
  };

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: '16px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
            {label}
          </Typography>
          {icon && (
            <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>
              {icon}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            {(trend !== undefined || trendLabel) && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
                {trend !== undefined && (
                  <Typography variant="body2" fontWeight={600} sx={{ color: trendColor }}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </Typography>
                )}
                {trendLabel && (
                  <Typography variant="caption" color="text.secondary">
                    {trendLabel}
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
          {renderSparkline()}
        </Box>
      </CardContent>
    </Card>
  );
}
