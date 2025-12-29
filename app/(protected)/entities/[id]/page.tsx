'use client';

import { getEntitiesAction, updateEntityAction } from '@/app-features/entities/entity.actions';
import { Entity } from '@/app-features/entities/entity.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGPage } from '@/ui/layouts/RNGPage';
import { Box, CircularProgress } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EntityForm } from '../_components/EntityForm';

export default function EntityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Ideally create a specific getEntityAction(id). For now, we filter locally or fetch all.
  // Assuming you add 'getEntityAction' later. Using list for MVP.
  const { execute: fetchAll, result: fetchResult } = useRngAction(getEntitiesAction);
  const { execute: update, isExecuting: isUpdating } = useRngAction(updateEntityAction, {
    successMessage: 'Entity updated successfully',
    onSuccess: () => router.push('/entities'),
  });

  const [entity, setEntity] = useState<Entity | null>(null);

  useEffect(() => {
    fetchAll({});
  }, []);

  useEffect(() => {
    if (fetchResult.data?.success) {
      const found = fetchResult.data.data.find((e) => e.id === id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setEntity(found);
    }
  }, [fetchResult, id]);

  if (!entity)
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );

  return (
    <RNGPage
      title={entity.name}
      description={`Manage details for ${entity.type}`}
      breadcrumbs={[
        { label: 'Entities', href: '/entities' },
        { label: entity.name, href: `/entities/${id}` },
      ]}
    >
      <EntityForm
        isEdit
        defaultValues={entity}
        onSubmit={async (data) => {
          await update({ id, data });
        }}
        isLoading={isUpdating}
      />
    </RNGPage>
  );
}
