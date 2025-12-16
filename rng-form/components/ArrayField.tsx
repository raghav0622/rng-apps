'use client';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
import { Box, Button, IconButton, Paper, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FieldWrapper } from '../FieldWrapper';
import { ArrayItem, FormSchema } from '../types';
import { FormBuilder } from './FormBuilder';

export function RNGArrayField<S extends FormSchema>({ item }: { item: ArrayItem<S> }) {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: item.name,
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  return (
    <FieldWrapper item={item}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {item.label}
        </Typography>
        {item.description && <Typography variant="caption">{item.description}</Typography>}
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={item.name}>
          {(provided) => (
            <Box {...provided.droppableProps} ref={provided.innerRef}>
              {fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(providedDrag, snapshot) => (
                    <Paper
                      ref={providedDrag.innerRef}
                      {...providedDrag.draggableProps}
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 2,
                        position: 'relative',
                        bgcolor: snapshot.isDragging ? 'action.hover' : 'background.default',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <Stack direction="row" alignItems="flex-start" spacing={2}>
                        {/* Drag Handle */}
                        <Box
                          {...providedDrag.dragHandleProps}
                          sx={{ mt: 1, cursor: 'grab', color: 'text.disabled' }}
                        >
                          <DragIndicator />
                        </Box>

                        {/* Content */}
                        <Box flexGrow={1}>
                          <Grid container spacing={2}>
                            <FormBuilder
                              uiSchema={item.items}
                              pathPrefix={`${item.name}.${index}`}
                            />
                          </Grid>
                        </Box>

                        {/* Delete Action */}
                        <IconButton
                          color="error"
                          onClick={() => remove(index)}
                          aria-label="Remove item"
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    </Paper>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        startIcon={<Add />}
        variant="outlined"
        onClick={() => {
          append(item.defaultValue || {});
        }}
      >
        {item.itemLabel || 'Add Item'}
      </Button>
    </FieldWrapper>
  );
}
