'use client';

import { getEntitiesAction, updateEntityAction } from '@/app-features/entities/entity.actions';
import { Entity } from '@/app-features/entities/entity.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { LoadingSpinner } from '@/rng-ui/LoadingSpinner';
import { RNGPage } from '@/rng-ui/layouts/RNGPage';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EntityForm } from '../_components/EntityForm';

export default function EntityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { execute: fetchAll } = useRngAction(getEntitiesAction);
  const { execute: update, isExecuting: isUpdating } = useRngAction(updateEntityAction, {
    successMessage: 'Entity updated successfully',
    onSuccess: () => router.push('/entities'),
  });

  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntity() {
      const result = await fetchAll({});
      if (result) {
        const found = result.find((e: Entity) => e.id === id);
        if (found) setEntity(found);
      }
      setLoading(false);
    }
    loadEntity();
  }, [id, fetchAll]);

  if (loading) {
    return <LoadingSpinner message="Loading entity..." />;
  }

  if (!entity) {
    return (
      <RNGPage title="Entity Not Found" description="The requested entity could not be found.">
        <div>No entity found with ID: {id}</div>
      </RNGPage>
    );
  }

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
      />
    </RNGPage>
  );
}
