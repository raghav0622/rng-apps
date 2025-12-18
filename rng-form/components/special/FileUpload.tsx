'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { CloudUpload } from '@mui/icons-material';
import { Box, Chip, styled, Typography } from '@mui/material';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface RNGFileUploadProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'file' };
}

export function RNGFileUpload<S extends FormSchema>({ item }: RNGFileUploadProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Box
          component="label"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 3,
            cursor: mergedItem.disabled ? 'not-allowed' : 'pointer',
            opacity: mergedItem.disabled ? 0.6 : 1,
            transition: 'border .2s ease-in-out',
            '&:hover': !mergedItem.disabled
              ? { borderColor: 'primary.main', bgcolor: 'action.hover' }
              : {},
          }}
        >
          <VisuallyHiddenInput
            type="file"
            multiple={mergedItem.multiple}
            accept={mergedItem.accept}
            disabled={mergedItem.disabled}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                field.onChange(mergedItem.multiple ? Array.from(files) : files[0]);
              }
            }}
          />
          <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography>Click or Drag to Upload {mergedItem.label}</Typography>

          {field.value && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Array.isArray(field.value) ? (
                field.value.map((f: File, i: number) => <Chip key={i} label={f.name} />)
              ) : (
                <Chip label={(field.value as File).name} />
              )}
            </Box>
          )}
        </Box>
      )}
    </FieldWrapper>
  );
}
