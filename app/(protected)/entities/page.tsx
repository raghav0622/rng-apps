'use client';

import { deleteEntityAction, getEntitiesAction } from '@/app-features/entities/entity.actions';
import { Entity } from '@/app-features/entities/entity.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGPage } from '@/ui/layouts/RNGPage';
import { useEffect, useState } from 'react';
import { EditEntityModal } from './_components/EditEntityModal';
import { EntityFormModal } from './_components/EntityFormModal';
import { EntityTable } from './_components/EntityTable';

export default function EntitiesPage() {
  const { execute, result, isExecuting } = useRngAction(getEntitiesAction);
  const { execute: deleteEntity } = useRngAction(deleteEntityAction, {
    successMessage: 'Entity deleted',
    onSuccess: () => execute({}), // Refresh list
  });

  // Edit State
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  useEffect(() => {
    execute({});
  }, [execute]);

  const entities = result.data && result.data.success ? result.data.data : [];

  return (
    <RNGPage
      title="Entities"
      description="Manage Clients, Vendors, and Consultants."
      actions={<EntityFormModal onSuccess={() => execute({})} />}
    >
      <EntityTable
        data={entities}
        isLoading={isExecuting}
        onEdit={(entity) => setEditingEntity(entity)}
        onDelete={(id) => {
          if (confirm('Are you sure you want to delete this entity?')) {
            deleteEntity({ id });
          }
        }}
      />

      {/* Edit Modal */}
      <EditEntityModal
        open={!!editingEntity}
        entity={editingEntity}
        onClose={() => setEditingEntity(null)}
        onSuccess={() => execute({})}
      />
    </RNGPage>
  );
}
