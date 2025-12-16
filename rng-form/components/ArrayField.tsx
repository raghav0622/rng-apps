'use client';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
import { Box, Button, IconButton, Paper, Stack } from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { ArrayItem, FormSchema } from '../types';
import { FieldWrapper } from './FieldWrapper';
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

  // We use FieldWrapper mostly for Layout/Logic visibility here, not for Controller
  return (
    <FieldWrapper item={item} name={item.name}>
      {/* We ignore the render prop controller since we use useFieldArray */}
      {() => (
        <Box sx={{ width: '100%' }}>
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
                            bgcolor: snapshot.isDragging ? 'action.hover' : 'background.default',
                          }}
                        >
                          <Stack direction="row" alignItems="flex-start" spacing={2}>
                            <Box
                              {...providedDrag.dragHandleProps}
                              sx={{ mt: 1, cursor: 'grab', color: 'text.disabled' }}
                            >
                              <DragIndicator />
                            </Box>
                            <Box flexGrow={1}>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                <FormBuilder
                                  uiSchema={item.items}
                                  pathPrefix={`${item.name}.${index}`}
                                />
                              </Box>
                            </Box>
                            <IconButton color="error" onClick={() => remove(index)}>
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
            onClick={() => append(item.defaultValue || {})}
          >
            {item.itemLabel || 'Add Item'}
          </Button>
        </Box>
      )}
    </FieldWrapper>
  );
}
