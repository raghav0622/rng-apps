'use client';

import { getAuditLogsAction } from '@/core/organization/organization.actions';
import { AuditLog } from '@/core/audit/audit.model'; // You might need to export this type
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

// Helper to format metadata into readable string
const formatMetadata = (meta?: Record<string, any>) => {
  if (!meta) return '-';
  return Object.entries(meta)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const { runAction, isExecuting } = useRNGServerAction(getAuditLogsAction, {
    onSuccess: (data) => setLogs(data),
  });

  useEffect(() => {
    runAction(undefined);
  }, []);

  return (
    <Card variant="outlined">
      <CardContent>
        <Box mb={3}>
          <Typography variant="h6">Activity Log</Typography>
          <Typography variant="body2" color="text.secondary">
            Recent actions performed within the organization.
          </Typography>
        </Box>

        {isExecuting && logs.length === 0 ? (
          <Typography color="text.secondary">Loading activity...</Typography>
        ) : logs.length === 0 ? (
          <Typography color="text.secondary">No activity found.</Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Actor (ID)</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Chip
                        label={log.action.split('.').pop()?.toUpperCase()}
                        size="small"
                        color="default"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {log.actorId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {formatMetadata(log.metadata)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.createdAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
