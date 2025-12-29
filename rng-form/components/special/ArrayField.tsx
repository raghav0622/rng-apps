'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormBuilder } from '@/rng-form/components/FormBuilder';
import { FormSchema, LayoutItem } from '@/rng-form/types';
import { Add, Delete } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';

interface RNGArrayFieldProps<S extends FormSchema> {
  item: LayoutItem<S> & { type: 'array' };
  pathPrefix?: string;
}

export function RNGArrayField<S extends FormSchema>({ item, pathPrefix }: RNGArrayFieldProps<S>) {
  const { control } = useFormContext();

  return (
    // 🛡️ Fix: Cast item to 'any' to satisfy FieldWrapper's strict InputItem type.
    // ArrayItem has 'label', 'name', 'required', etc., so it is runtime compatible.
    <FieldWrapper item={item as any} name={item.name} pathPrefix={pathPrefix}>
      {() => <ArrayFieldContent item={item} control={control} />}
    </FieldWrapper>
  );
}

function ArrayFieldContent({
  item,
  control,
}: {
  item: LayoutItem<any> & { type: 'array' };
  control: any;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: item.name as string, // This name is already scoped by RenderItem
  });

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      {fields.map((field, index) => (
        <Card key={field.id} variant="outlined">
          <CardHeader
            title={
              <Typography variant="subtitle2" color="text.secondary">
                {item.itemLabel || 'Item'} #{index + 1}
              </Typography>
            }
            action={
              <IconButton
                size="small"
                onClick={() => remove(index)}
                color="error"
                aria-label="remove item"
              >
                <Delete />
              </IconButton>
            }
            sx={{ pb: 0 }}
          />
          <CardContent>
            {/* ✅ Recursion Magic: 
               We pass the new pathPrefix so children register as:
               "parentArray.0.childField" 
            */}
            <FormBuilder uiSchema={item.items} pathPrefix={`${item.name}.${index}`} />
          </CardContent>
        </Card>
      ))}

      <Box>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => append(item.defaultValue || {})}
        >
          Add {item.itemLabel || 'Item'}
        </Button>
      </Box>
    </Stack>
  );
}
