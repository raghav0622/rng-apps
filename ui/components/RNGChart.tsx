'use client';

import { Box, Paper, Typography, useTheme } from '@mui/material';
import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type RNGChartType = 'line' | 'bar' | 'area' | 'pie';

interface RNGChartProps {
  /**
   * The type of chart to render.
   */
  type: RNGChartType;
  /**
   * The data for the chart.
   * Each object in the array represents a data point.
   */
  data: any[];
  /**
   * The key for the X-axis (for line, bar, area charts).
   */
  xAxisKey?: string;
  /**
   * An array of data keys to display on the Y-axis/values.
   * For Pie charts, the first key is the value, the second is the name.
   */
  dataKeys: { key: string; name?: string; color?: string }[];
  /**
   * Optional title for the chart.
   */
  title?: string;
  /**
   * Height of the chart container.
   * @default 300
   */
  height?: number;
  /**
   * Show Cartesian Grid (for line, bar, area).
   * @default false
   */
  showGrid?: boolean;
  /**
   * Custom tooltip formatter function.
   */
  tooltipFormatter?: (value: string | number, name: string, props: any) => React.ReactNode;
  /**
   * Custom legend formatter function.
   */
  legendFormatter?: (value: string, entry: any) => React.ReactNode;
}

/**
 * 🎨 RNGChart
 * A theme-aware wrapper around Recharts for displaying various chart types.
 * Automatically applies enterprise theme colors and responsive sizing.
 */
export function RNGChart({
  type,
  data,
  xAxisKey,
  dataKeys,
  title,
  height = 300,
  showGrid = false,
  tooltipFormatter,
  legendFormatter,
}: RNGChartProps) {
  const theme = useTheme();
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis dataKey={xAxisKey} stroke={theme.palette.text.secondary} />
            <YAxis stroke={theme.palette.text.secondary} />
            <Tooltip
              formatter={tooltipFormatter as any}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                borderRadius: theme.shape.borderRadius,
              }}
            />
            <Legend formatter={legendFormatter} />
            {dataKeys.map((item, i) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.name || item.key}
                stroke={item.color || colors[i % colors.length]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis dataKey={xAxisKey} stroke={theme.palette.text.secondary} />
            <YAxis stroke={theme.palette.text.secondary} />
            <Tooltip
              formatter={tooltipFormatter as any}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                borderRadius: theme.shape.borderRadius,
              }}
            />
            <Legend formatter={legendFormatter} />
            {dataKeys.map((item, i) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.name || item.key}
                fill={item.color || colors[i % colors.length]}
              />
            ))}
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis dataKey={xAxisKey} stroke={theme.palette.text.secondary} />
            <YAxis stroke={theme.palette.text.secondary} />
            <Tooltip
              formatter={tooltipFormatter as any}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                borderRadius: theme.shape.borderRadius,
              }}
            />
            <Legend formatter={legendFormatter} />
            {dataKeys.map((item, i) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.name || item.key}
                stroke={item.color || colors[i % colors.length]}
                fill={item.color || colors[i % colors.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        );
      case 'pie':
        const valueKey = dataKeys[0]?.key; // First key is value for pie
        const nameKey = dataKeys[1]?.key || 'name'; // Second key is name
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={tooltipFormatter as any}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                borderRadius: theme.shape.borderRadius,
              }}
            />
            <Legend formatter={legendFormatter} />
          </PieChart>
        );
      default:
        return <Typography color="error">Unsupported chart type</Typography>;
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: height + 50, // Add some height for title and padding
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
      }}
    >
      {title && (
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ flexGrow: 1 }}>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
