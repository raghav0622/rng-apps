'use client';

import { deleteEntityAction, getEntitiesAction } from '@/app-features/entities/entity.actions';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGButton } from '@/ui/components/RNGButton'; // ✅ Custom Button
import { RNGPage } from '@/ui/layouts/RNGPage';
import { Add, Dashboard } from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EntityTable } from '../_components/EntityTable';

export default function EntityGridPage() {
  const router = useRouter();
  const { execute, result, isExecuting } = useRngAction(getEntitiesAction);
  const { execute: deleteEntity } = useRngAction(deleteEntityAction, {
    successMessage: 'Deleted successfully',
    onSuccess: () => execute({}),
  });

  useEffect(() => {
    execute({});
  }, [execute]);
  const entities = result.data?.success ? result.data.data : [];

  return (
    <RNGPage
      title="Entity Database"
      description="Tabular view of all registered entities."
      breadcrumbs={[
        { label: 'Entities', href: '/entities' },
        { label: 'Grid', href: '/entities/grid' },
      ]}
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <RNGButton
            startIcon={<Dashboard />}
            component={Link}
            href="/entities"
            rngVariant="secondary"
          >
            Card View
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
      <EntityTable
        data={entities}
        isLoading={isExecuting}
        onEdit={(e) => router.push(`/entities/${e.id}`)}
        onDelete={(id) => {
          if (confirm('Delete?')) deleteEntity({ id });
        }}
      />
    </RNGPage>
  );
}
