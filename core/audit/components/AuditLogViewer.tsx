'use client';

import { AuditLog } from '@/core/audit/audit.model';
import { getAuditLogsAction } from '@/core/organization/organization.actions';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface AuditLogWithProfiles extends AuditLog {
  actor?: {
    displayName?: string;
    email: string;
    photoURL?: string;
  };
  target?: {
    displayName?: string;
    email: string;
    photoURL?: string;
  };
}

const formatDetails = (action: string, meta?: Record<string, any>) => {
  if (!meta) return '-';
  const entries = Object.entries(meta);
  if (entries.length === 0) return '-';

  // Specific Action Formatting
  if (action.includes('update_role')) {
    return `Changed role to ${meta.newRole}`;
  }
  if (action.includes('ownership_offer')) {
    return `Offered ownership transfer`;
  }
  if (action.includes('ownership_transfer')) {
    return `Finalized ownership transfer`;
  }
  if (action.includes('member.invite')) {
    return `Sent invitation to ${meta.email} as ${meta.role}`;
  }
  if (action.includes('invite.accept')) {
    return `Joined organization via invitation`;
  }
  if (action.includes('invite.reject')) {
    return `Declined organization invitation`;
  }
  if (action.includes('invite.revoke')) {
    return `Revoked invitation for ${meta.email}`;
  }
  if (action.includes('org.update')) {
    if (meta.name) return `Renamed organization to "${meta.name}"`;
    return 'Updated organization settings';
  }
  if (action.includes('member.remove')) {
    return `Removed member from organization`;
  }

  return entries
    .map(([k, v]) => {
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return `${k}: ${val}`;
    })
    .join(', ');
};

function UserProfileCell({ profile, fallbackId }: { profile?: any; fallbackId: string }) {
  if (!profile) {
    return (
      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
        {fallbackId.substring(0, 8)}...
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar
        src={profile.photoURL}
        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
      >
        {profile.displayName?.charAt(0) || profile.email?.charAt(0)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" fontWeight={600} display="block" noWrap>
          {profile.displayName || 'Unknown'}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" noWrap>
          {profile.email}
        </Typography>
      </Box>
    </Stack>
  );
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogWithProfiles[]>([]);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const { runAction, isExecuting } = useRNGServerAction(getAuditLogsAction, {
    onSuccess: (data: any) => setLogs(data),
  });

  useEffect(() => {
    runAction(undefined);
  }, []);

  const paginatedLogs = logs.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

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
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Actor & Target</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Details</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isExecuting && logs.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={200} /></TableCell>
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
              paginatedLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Chip
                      label={log.action.split('.').pop()?.toUpperCase() || log.action}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <UserProfileCell profile={log.actor} fallbackId={log.actorId} />
                      {log.target && (
                        <>
                          <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <UserProfileCell profile={log.target} fallbackId={log.targetId || ''} />
                        </>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'text.secondary',
                      }}
                    >
                      {formatDetails(log.action, log.metadata)}
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

      {/* Pagination Controls */}
      {logs.length > rowsPerPage && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            size="small"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Typography variant="caption" alignSelf="center">
            Page {page + 1} of {Math.ceil(logs.length / rowsPerPage)}
          </Typography>
          <Button
            size="small"
            disabled={page >= Math.ceil(logs.length / rowsPerPage) - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </Box>
      )}
    </Card>
  );
}
