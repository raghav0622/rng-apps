import { Delete, Edit } from '@mui/icons-material';
import { Box, IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import { ReactNode } from 'react';
import { RNGCard } from './RNGCard';

/**
 * Action Card Component with Hover Effects and Action Buttons
 * 
 * Reusable card component that includes:
 * - Hover elevation and transform effects
 * - Top-right action buttons (edit, delete, custom)
 * - Click handling with action button isolation
 * - Consistent styling across the application
 * 
 * @example
 * ```tsx
 * <RNGActionCard
 *   onEdit={() => router.push(`/items/${item.id}`)}
 *   onDelete={async () => await deleteItem(item.id)}
 *   onClick={() => router.push(`/items/${item.id}/view`)}
 * >
 *   <Typography>{item.name}</Typography>
 *   <Typography variant="caption">{item.description}</Typography>
 * </RNGActionCard>
 * ```
 */
export interface RNGActionCardProps {
  /** Card content */
  children: ReactNode;
  
  /** Callback when edit button is clicked */
  onEdit?: () => void;
  
  /** Callback when delete button is clicked */
  onDelete?: () => void;
  
  /** Callback when card body is clicked (not action buttons) */
  onClick?: () => void;
  
  /** Additional action buttons to display */
  customActions?: ReactNode;
  
  /** Hide edit button */
  hideEdit?: boolean;
  
  /** Hide delete button */
  hideDelete?: boolean;
  
  /** Additional styles */
  sx?: SxProps<Theme>;
  
  /** Tooltip for edit button */
  editTooltip?: string;
  
  /** Tooltip for delete button */
  deleteTooltip?: string;
}

/**
 * Action Card with built-in hover effects and action buttons
 * 
 * Provides a consistent pattern for cards that need edit/delete actions.
 * Automatically prevents action button clicks from triggering card onClick.
 * 
 * @param props - Component props
 * @returns RNGActionCard component
 */
export function RNGActionCard({
  children,
  onEdit,
  onDelete,
  onClick,
  customActions,
  hideEdit = false,
  hideDelete = false,
  sx,
  editTooltip = 'Edit',
  deleteTooltip = 'Delete',
}: RNGActionCardProps) {
  const hasActions = !hideEdit || !hideDelete || customActions;

  return (
    <RNGCard
      sx={{
        height: '100%',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
        ...sx,
      }}
    >
      {/* Action Buttons */}
      {hasActions && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.5,
            zIndex: 1,
          }}
        >
          {customActions}
          
          {!hideEdit && onEdit && (
            <Tooltip title={editTooltip}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'primary.light' },
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {!hideDelete && onDelete && (
            <Tooltip title={deleteTooltip}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'error.light' },
                }}
              >
                <Delete fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Card Content */}
      <Box
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          pt: hasActions ? 1 : 0,
        }}
      >
        {children}
      </Box>
    </RNGCard>
  );
}
