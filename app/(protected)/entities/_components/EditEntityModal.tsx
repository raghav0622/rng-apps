'use client';

import { updateEntityAction } from '@/app-features/entities/entity.actions';
import { EntityFormSchema, entityFormUI } from '@/app-features/entities/entity.form';
import { Entity } from '@/app-features/entities/entity.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Close } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';

interface EditEntityModalProps {
  entity: Entity | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEntityModal({ entity, open, onClose, onSuccess }: EditEntityModalProps) {
  const { execute, isExecuting } = useRngAction(updateEntityAction, {
    successMessage: 'Entity updated successfully',
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  if (!entity) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Edit Entity
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <RNGForm
          schema={EntityFormSchema}
          uiSchema={entityFormUI}
          defaultValues={{
            name: entity.name,
            type: entity.type,
            status: entity.status,
            email: entity.email || '',
            phone: entity.phone || '',
            address: entity.address || '',
            tags: entity.tags || [],
            details: entity.details || {},
            notes: entity.notes || '',
          }}
          onSubmit={async (data) => {
            await execute({ id: entity.id, data: data as any });
          }}
          submitLabel={isExecuting ? 'Saving...' : 'Save Changes'}
          // ❌ REMOVED: isLoading={isExecuting} (Not supported by RNGForm)
        />
      </DialogContent>
    </Dialog>
  );
}
