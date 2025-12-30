'use client';

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableStateSnapshot
} from '@hello-pangea/dnd';
import { Box, Paper, Stack, Typography, useTheme, IconButton } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';
import { ReactNode } from 'react';

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

export interface KanbanItem {
  id: string;
  content: ReactNode;
}

interface RNGKanbanBoardProps {
  columns: KanbanColumn[];
  onDragEnd: (result: DropResult) => void;
  onAddCard?: (columnId: string) => void;
}

/**
 * 🎨 RNGKanbanBoard
 * A drag-and-drop board for task management and workflows.
 * Powered by @hello-pangea/dnd for accessible, performant interactions.
 */
export function RNGKanbanBoard({ columns, onDragEnd, onAddCard }: RNGKanbanBoardProps) {
  const theme = useTheme();

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          overflowX: 'auto',
          height: '100%',
          pb: 2,
          alignItems: 'flex-start',
        }}
      >
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
              <Paper
                ref={provided.innerRef}
                {...provided.droppableProps}
                variant="outlined"
                sx={{
                  minWidth: 280,
                  width: 320,
                  bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '100%',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {/* Column Header */}
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" fontWeight={700}>
                      {column.title}
                    </Typography>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: 'action.selected',
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'text.secondary',
                      }}
                    >
                      {column.items.length}
                    </Box>
                  </Stack>
                  <IconButton size="small">
                    <MoreHorizIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Column Body */}
                <Box
                  sx={{
                    p: 1.5,
                    flexGrow: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    minHeight: 100,
                  }}
                >
                  {column.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(
                        dragProvided: DraggableProvided,
                        dragSnapshot: DraggableStateSnapshot
                      ) => (
                        <Paper
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          elevation={dragSnapshot.isDragging ? 4 : 0}
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: 'background.default',
                            borderColor: dragSnapshot.isDragging
                              ? 'primary.main'
                              : 'divider',
                            cursor: 'grab',
                            transition: 'box-shadow 0.2s, border-color 0.2s',
                            '&:hover': {
                              borderColor: 'text.secondary',
                            },
                            ...dragProvided.draggableProps.style, // Essential for dnd positioning
                          }}
                        >
                          {item.content}
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>

                {/* Column Footer */}
                {onAddCard && (
                  <Box sx={{ p: 1, pt: 0 }}>
                    <Box
                      onClick={() => onAddCard(column.id)}
                      sx={{
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        color: 'text.secondary',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          color: 'text.primary',
                        },
                      }}
                    >
                      <AddIcon fontSize="small" />
                      <Typography variant="body2" fontWeight={500}>
                        Add Card
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            )}
          </Droppable>
        ))}
      </Box>
    </DragDropContext>
  );
}
