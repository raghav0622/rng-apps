'use client';

import { Entity } from '@/app-features/entities/entity.model';
import { RNGDataGrid } from '@/ui/components/RNGDataGrid';
import { Delete, Edit } from '@mui/icons-material';
import { Chip } from '@mui/material';
import { GridActionsCellItem, GridColDef } from '@mui/x-data-grid';

interface EntityTableProps {
  data: Entity[];
  isLoading?: boolean;
  onEdit: (entity: Entity) => void; // ✅ New Prop
  onDelete: (id: string) => void; // ✅ New Prop
}

export function EntityTable({ data, isLoading, onEdit, onDelete }: EntityTableProps) {
  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />,
    },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    {
      field: 'tags',
      headerName: 'Tags',
      flex: 1,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {((params.value as string[]) || []).slice(0, 2).map((tag) => (
            <Chip key={tag} label={tag} size="small" style={{ fontSize: '0.7rem' }} />
          ))}
        </div>
      ),
    },
    // ✅ Actions Column
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
