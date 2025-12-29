'use client';

import { getEntitiesAction } from '@/app-features/entities/entity.actions';
import { Entity, EntityType } from '@/app-features/entities/entity.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGButton } from '@/ui/components/RNGButton'; // ✅ Custom Button
import { RNGCard } from '@/ui/components/RNGCard'; // ✅ Custom Card
import { RNGPage } from '@/ui/layouts/RNGPage';
import { Add, TableView } from '@mui/icons-material';
import { Box, Chip, Grid, Typography, useTheme } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

export default function EntitiesDashboard() {
  const router = useRouter();
  const theme = useTheme();
  const { execute, result } = useRngAction(getEntitiesAction);

  useEffect(() => {
    execute({});
  }, [execute]);
  const entities = result.data?.success ? result.data.data : [];

  const grouped = useMemo(() => {
    const groups: Record<EntityType, Entity[]> = {
      [EntityType.CLIENT]: [],
      [EntityType.VENDOR]: [],
      [EntityType.CONTRACTOR]: [],
      [EntityType.CONSULTANT]: [],
    };
    entities.forEach((e: Entity) => {
      if (groups[e.type]) groups[e.type].push(e);
    });
    return groups;
  }, [entities]);

  return (
    <RNGPage
      title="Entities Overview"
      description="Manage your contacts grouped by category."
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <RNGButton
            startIcon={<TableView />}
            component={Link}
            href="/entities/grid"
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
                    {/* ✅ RNGCard with Navigation */}
                    <RNGCard
                      onClick={() => router.push(`/entities/${entity.id}`)}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)', borderColor: 'primary.main' },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {entity.name}
                        </Typography>
                        {entity.status === 'INACTIVE' && <Chip label="Inactive" size="small" />}
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
                      </Box>
                    </RNGCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Box>
    </RNGPage>
  );
}
