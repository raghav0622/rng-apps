'use client';

import { deleteEntityAction, getEntitiesAction } from '@/app-features/entities/entity.actions';
import { Entity, EntityType } from '@/app-features/entities/entity.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGButton } from '@/ui/components/RNGButton';
import { RNGCard } from '@/ui/components/RNGCard';
import { RNGPage } from '@/ui/layouts/RNGPage';
import { Add, Delete, Edit, TableView } from '@mui/icons-material';
import { Box, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type SortField = 'name' | 'type' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

export default function EntitiesDashboard() {
  const router = useRouter();
  const { execute, result } = useRngAction(getEntitiesAction);
  const { execute: deleteEntity } = useRngAction(deleteEntityAction);
  
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<EntityType | 'ALL'>('ALL');

  useEffect(() => {
    execute({});
  }, [execute]);
  
  const entities = result.data?.success ? result.data.data : [];

  // Apply sorting and filtering
  const sortedAndFiltered = useMemo(() => {
    let filtered = [...entities];
    
    // Filter by type
    if (filterType !== 'ALL') {
      filtered = filtered.filter((e: Entity) => e.type === filterType);
    }

    // Sort
    filtered.sort((a: Entity, b: Entity) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [entities, sortField, sortDirection, filterType]);

  // Group by type for display
  const grouped = useMemo(() => {
    const groups: Record<EntityType, Entity[]> = {
      [EntityType.CLIENT]: [],
      [EntityType.VENDOR]: [],
      [EntityType.CONTRACTOR]: [],
      [EntityType.CONSULTANT]: [],
    };
    sortedAndFiltered.forEach((e: Entity) => {
      if (groups[e.type]) groups[e.type].push(e);
    });
    return groups;
  }, [sortedAndFiltered]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This action cannot be undone.`)) {
      await deleteEntity({ id });
      execute({}); // Refresh list
    }
  };

  return (
    <RNGPage
      title="Entities Overview"
      description="Manage your contacts grouped by category."
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <RNGButton
            startIcon={<TableView />}
            component={Link}
            href="/entities/grid-view"
            rngVariant="secondary"
          >
            Grid View
          </RNGButton>
          <RNGButton
            startIcon={<Add />}
            component={Link}
            href="/entities/create"
            rngVariant="primary"
          >
            New Entity
          </RNGButton>
        </div>
      }
    >
      {/* Filters and Sorting */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Type</InputLabel>
          <Select
            value={filterType}
            label="Filter by Type"
            onChange={(e) => setFilterType(e.target.value as EntityType | 'ALL')}
          >
            <MenuItem value="ALL">All Types</MenuItem>
            <MenuItem value={EntityType.CLIENT}>Client</MenuItem>
            <MenuItem value={EntityType.VENDOR}>Vendor</MenuItem>
            <MenuItem value={EntityType.CONTRACTOR}>Contractor</MenuItem>
            <MenuItem value={EntityType.CONSULTANT}>Consultant</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortField}
            label="Sort By"
            onChange={(e) => setSortField(e.target.value as SortField)}
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="type">Type</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="createdAt">Created Date</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Order</InputLabel>
          <Select
            value={sortDirection}
            label="Order"
            onChange={(e) => setSortDirection(e.target.value as SortDirection)}
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />
        
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {sortedAndFiltered.length} {sortedAndFiltered.length === 1 ? 'entity' : 'entities'}
        </Typography>
      </Box>

      {/* Entity Cards by Type */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(Object.keys(grouped) as EntityType[]).map((type) => {
          const list = grouped[type] || [];
          if (list.length === 0) return null;

          return (
            <Box key={type}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  pl: 2,
                  fontWeight: 600,
                }}
              >
                {type}s <Chip label={list.length} size="small" sx={{ ml: 1, borderRadius: 1 }} />
              </Typography>

              <Grid container spacing={2}>
                {list.map((entity) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={entity.id}>
                    <RNGCard
                      sx={{
                        height: '100%',
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': { 
                          transform: 'translateY(-4px)', 
                          boxShadow: 3,
                        },
                      }}
                    >
                      {/* Action Buttons */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          display: 'flex',
                          gap: 0.5,
                          zIndex: 1,
                        }}
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/entities/${entity.id}`);
                            }}
                            sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'primary.light' } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entity.id, entity.name);
                            }}
                            sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.light' } }}
                          >
                            <Delete fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Card Content */}
                      <Box 
                        onClick={() => router.push(`/entities/${entity.id}`)}
                        sx={{ cursor: 'pointer', pt: 1 }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pr: 7 }}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>
                            {entity.name}
                          </Typography>
                          {entity.status === 'INACTIVE' && (
                            <Chip label="Inactive" size="small" color="warning" />
                          )}
                          {entity.status === 'BLACKLISTED' && (
                            <Chip label="Blacklisted" size="small" color="error" />
                          )}
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {entity.email || 'No Email'}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(entity.tags || []).slice(0, 3).map((t) => (
                            <Chip
                              key={t}
                              label={t}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                          ))}
                          {(entity.tags || []).length > 3 && (
                            <Chip
                              label={`+${entity.tags.length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </RNGCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Box>

      {sortedAndFiltered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No entities found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {filterType !== 'ALL' 
              ? `No ${filterType.toLowerCase()}s match your filter.`
              : 'Start by creating your first entity.'}
          </Typography>
          <RNGButton
            startIcon={<Add />}
            component={Link}
            href="/entities/create"
            rngVariant="primary"
          >
            New Entity
          </RNGButton>
        </Box>
      )}
    </RNGPage>
  );
}
