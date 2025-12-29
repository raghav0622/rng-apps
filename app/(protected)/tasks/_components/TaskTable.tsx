'use client';

import { Task, TaskStatus } from '@/app-features/tasks/task.model';
import { RNGDataGrid } from '@/ui/components/RNGDataGrid';
import { Assignment, Delete, Edit, Timer } from '@mui/icons-material';
import { Box, Chip, LinearProgress, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridColDef } from '@mui/x-data-grid';

interface TaskTableProps {
  data: Task[];
  isLoading?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onViewDetails?: (task: Task) => void;
}

// Helper function to get status color
function getStatusColor(status: TaskStatus): 'default' | 'primary' | 'secondary' | 'warning' | 'success' | 'error' {
  switch (status) {
    case TaskStatus.TODO:
      return 'default';
    case TaskStatus.IN_PROGRESS:
      return 'primary';
    case TaskStatus.UNDER_REVIEW:
      return 'warning';
    case TaskStatus.CHANGES_REQUESTED:
      return 'error';
    case TaskStatus.DONE:
      return 'success';
    default:
      return 'default';
  }
}

// Helper function to calculate task economics
function calculateEconomics(task: Task) {
  const totalMinutes = task.timeLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const totalHours = totalMinutes / 60;
  const cost = totalHours * task.costRate;
  const revenue = totalHours * task.billableRate;
  const profitability = revenue - cost;
  
  return {
    totalMinutes,
    totalHours: totalHours.toFixed(2),
    cost: cost.toFixed(2),
    revenue: revenue.toFixed(2),
    profitability: profitability.toFixed(2),
    margin: revenue > 0 ? ((profitability / revenue) * 100).toFixed(1) : '0',
  };
}

export function TaskTable({ data, isLoading, onEdit, onDelete, onViewDetails }: TaskTableProps) {
  const columns: GridColDef[] = [
    { 
      field: 'title', 
      headerName: 'Title', 
      flex: 1, 
      minWidth: 250,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.value}
          </Typography>
          {params.row.resourceType !== 'GENERAL' && (
            <Typography variant="caption" color="text.secondary">
              {params.row.resourceType}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value.replace('_', ' ')} 
          size="small" 
          color={getStatusColor(params.value)}
          variant="outlined"
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => {
        const color = params.value === 'HIGH' ? 'error' : params.value === 'MEDIUM' ? 'warning' : 'default';
        return <Chip label={params.value} size="small" color={color} />;
      },
    },
    {
      field: 'assignedTo',
      headerName: 'Assigned',
      width: 120,
      renderCell: (params) => (
        params.value ? (
          <Chip 
            icon={<Assignment />} 
            label="Assigned" 
            size="small" 
            variant="outlined" 
          />
        ) : (
          <Typography variant="caption" color="text.disabled">Unassigned</Typography>
        )
      ),
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 150,
      renderCell: (params) => {
        const task = params.row as Task;
        const economics = calculateEconomics(task);
        const estimatedHours = task.estimatedMinutes / 60;
        const progress = estimatedHours > 0 
          ? Math.min((parseFloat(economics.totalHours) / estimatedHours) * 100, 100) 
          : 0;
        
        return (
          <Tooltip title={`${economics.totalHours}h of ${estimatedHours.toFixed(1)}h estimated`}>
            <Box sx={{ width: '100%' }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: 'economics',
      headerName: 'P&L',
      width: 120,
      renderCell: (params) => {
        const task = params.row as Task;
        const economics = calculateEconomics(task);
        const profit = parseFloat(economics.profitability);
        
        return (
          <Tooltip title={`Revenue: $${economics.revenue} | Cost: $${economics.cost} | Margin: ${economics.margin}%`}>
            <Box>
              <Typography 
                variant="body2" 
                fontWeight={600}
                color={profit >= 0 ? 'success.main' : 'error.main'}
              >
                ${economics.profitability}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {economics.margin}% margin
              </Typography>
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Edit"
          onClick={() => onEdit(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete color="error" />}
          label="Delete"
          onClick={() => onDelete(params.row.id)}
        />,
      ],
    },
  ];

  return <RNGDataGrid rows={data} columns={columns} loading={isLoading} height={600} />;
}
