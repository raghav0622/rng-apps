'use client';

import { AuditLog } from '@/core/audit/audit.model';
import { getAuditLogsAction } from '@/core/organization/organization.actions';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import {
  Box,
  Card,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';

const formatMetadata = (meta?: Record<string, any>) => {
  if (!meta) return '-';
  const entries = Object.entries(meta);
  if (entries.length === 0) return '-';
  
  return entries
    .map(([k, v]) => {
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return `${k}: ${val}`;
    })
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
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Activity Log
        </Typography>
      </Box>
      
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Actor</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Details</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isExecuting && logs.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={200} /></TableCell>
                  <TableCell><Skeleton width={120} /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No activity found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Chip
                      label={log.action.split('.').pop()?.toUpperCase() || log.action}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {log.actorId.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ 
                      maxWidth: 400, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      color: 'text.secondary'
                    }}>
                      {formatMetadata(log.metadata)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.createdAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
