'use client';

import { applyFiltersAndSave, resizeImageForEditor } from '@/rng-form/utils/image-processing';
import {
  Brightness6,
  Close,
  Contrast,
  Flip,
  InvertColors,
  Refresh,
  RotateLeft,
  RotateRight,
  Save,
  Tune,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Slider,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { Cropper, CropperRef, ImageRestriction } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';

// --- Types ---

export interface EditorFilters {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface ImageEditorModalProps {
  open: boolean;
  src: string | null;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
  aspectRatio?: number;
  lockAspectRatio?: boolean;
  cropShape?: 'rect' | 'round';
}

const DEFAULT_FILTERS: EditorFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

const ASPECT_RATIOS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '2:3', value: 2 / 3 },
];

/**
 * MEMOIZED CROPPER STAGE
 * This component is heavy. We memoize it so it DOES NOT re-render when slider values change.
 * Visual updates are handled via CSS Variables injected into the container ref.
 */
const MemoizedCropperStage = React.memo(
  React.forwardRef(
    (
      {
        loading,
        optimizedSrc,
        aspect,
        cropShape,
        onCropperInit,
      }: {
        loading: boolean;
        optimizedSrc: string | null;
        aspect?: number;
        cropShape: 'rect' | 'round';
        onCropperInit: (ref: CropperRef) => void;
      },
      forwardedRef: React.ForwardedRef<HTMLDivElement>,
    ) => {
      return (
        <Grid
          size={{ xs: 12, md: 9 }}
          ref={forwardedRef}
          className="rng-editor-stage"
          sx={{
            position: 'relative',
            bgcolor: '#000000',
            height: { xs: '50%', md: '100%' },
            borderRight: { md: 1 },
            borderColor: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <CircularProgress color="primary" />
              <Typography variant="caption" color="text.secondary">
                Optimizing image...
              </Typography>
            </Box>
          ) : optimizedSrc ? (
            <Box sx={{ width: '100%', height: '100%' }}>
              <Cropper
                ref={onCropperInit}
                src={optimizedSrc}
                className="rng-cropper"
                stencilProps={{
                  aspectRatio: aspect,
                  grid: true,
                  previewClassName: cropShape === 'round' ? 'circle-preview' : undefined,
                }}
                style={{ height: '100%', width: '100%', outline: 'none' }}
                imageRestriction={ImageRestriction.stencil}
              />

              {/* Robust CSS Injection for Filters */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                  .rng-editor-stage .rng-cropper img,
                  .rng-editor-stage .rng-cropper .rac-image {
                     filter: brightness(var(--brightness, 100%)) 
                             contrast(var(--contrast, 100%)) 
                             saturate(var(--saturation, 100%));
                     will-change: filter;
                  }
                  ${
                    cropShape === 'round'
                      ? `
                  .circle-preview {
                    border-radius: 50%;
                    cursor: move;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85);
                  }
                  `
                      : ''
                  }
                `,
                }}
              />
            </Box>
          ) : null}
        </Grid>
      );
    },
  ),
);

MemoizedCropperStage.displayName = 'MemoizedCropperStage';

export function ImageEditorModal({
  open,
  src,
  onClose,
  onSave,
  aspectRatio: initialAspectRatio,
  lockAspectRatio = false,
  cropShape = 'rect',
}: ImageEditorModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const cropperRef = useRef<CropperRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // --- State ---
  // UI State for sliders (re-renders controls, but NOT cropper due to memo)
  const [filters, setFilters] = useState<EditorFilters>(DEFAULT_FILTERS);

  // Committed state for Saving (Debounced)
  const committedFiltersRef = useRef<EditorFilters>(DEFAULT_FILTERS);

  const [saving, setSaving] = useState(false);
  const [aspect, setAspect] = useState<number | undefined>(initialAspectRatio);
  const [flipState, setFlipState] = useState({ h: false, v: false });

  // Optimization State
  const [optimizedSrc, setOptimizedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- 1. Optimization Phase ---
  useEffect(() => {
    let active = true;

    if (open && src) {
      setLoading(true);
      // Reset
      setFilters(DEFAULT_FILTERS);
      committedFiltersRef.current = DEFAULT_FILTERS;
      setAspect(initialAspectRatio);
      setFlipState({ h: false, v: false });
      updateCSSVariables(DEFAULT_FILTERS);

      resizeImageForEditor(src, 2048)
        .then((url) => {
          if (active) {
            setOptimizedSrc(url);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Image optimization failed, falling back to original', err);
          if (active) {
            setOptimizedSrc(src);
            setLoading(false);
          }
        });
    }

    return () => {
      active = false;
      if (optimizedSrc && optimizedSrc !== src && optimizedSrc.startsWith('blob:')) {
        URL.revokeObjectURL(optimizedSrc);
      }
      setOptimizedSrc(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, src]);

  // --- Helper: CSS Updates ---
  const updateCSSVariables = (vals: EditorFilters) => {
    if (editorContainerRef.current) {
      const el = editorContainerRef.current;
      el.style.setProperty('--brightness', `${vals.brightness}%`);
      el.style.setProperty('--contrast', `${vals.contrast}%`);
      el.style.setProperty('--saturation', `${vals.saturation}%`);
    }
  };

  // --- Handlers ---

  const handleFilterChange = (field: keyof EditorFilters, value: number) => {
    const newFilters = { ...filters, [field]: value };
    // 1. Update UI (Sliders)
    setFilters(newFilters);
    // 2. Update Visuals (Instant CSS)
    updateCSSVariables(newFilters);
    // 3. Update Ref for Save (No Debounce needed for ref, it's cheap)
    committedFiltersRef.current = newFilters;
  };

  const handleSave = async () => {
    if (!cropperRef.current || !optimizedSrc) return;

    setSaving(true);
    try {
      const canvas = cropperRef.current.getCanvas();
      if (!canvas) throw new Error('Could not create canvas');

      // Use the ref to get the most recent values
      const file = await applyFiltersAndSave(
        canvas,
        committedFiltersRef.current,
        `edited_${Date.now()}.jpg`,
      );

      if (file) {
        await onSave(file);
        onClose();
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const rotateImage = (angle: number) => {
    cropperRef.current?.rotateImage(angle);
  };

  const flipImage = (type: 'h' | 'v') => {
    if (!cropperRef.current) return;
    const newH = type === 'h' ? !flipState.h : flipState.h;
    const newV = type === 'v' ? !flipState.v : flipState.v;
    cropperRef.current.flipImage(newH, newV);
    setFlipState({ h: newH, v: newV });
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    committedFiltersRef.current = DEFAULT_FILTERS;
    updateCSSVariables(DEFAULT_FILTERS);
    setAspect(initialAspectRatio);
    setFlipState({ h: false, v: false });
    cropperRef.current?.reset();
  };

  // --- UI Sub-components ---

  const FilterControl = ({
    label,
    icon,
    value,
    field,
    min = 0,
    max = 200,
  }: {
    label: string;
    icon: React.ReactNode;
    value: number;
    field: keyof EditorFilters;
    min?: number;
    max?: number;
  }) => {
    return (
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Box display="flex" alignItems="center" gap={1} color="text.secondary">
            {icon}
            <Typography variant="body2" fontWeight={500}>
              {label}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight="mono">
            {value}%
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 8, sm: 9 }}>
            <Slider
              size="small"
              value={value}
              min={min}
              max={max}
              onChange={(_, v) => handleFilterChange(field, v as number)}
              aria-label={label}
            />
          </Grid>
          <Grid size={{ xs: 4, sm: 3 }}>
            <TextField
              variant="outlined"
              size="small"
              value={value}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) handleFilterChange(field, num);
              }}
              slotProps={{
                htmlInput: {
                  min,
                  max,
                  step: 1,
                  style: {
                    textAlign: 'center',
                    padding: '4px 2px',
                    fontSize: '0.85rem',
                  },
                },
              }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: fullScreen ? '100%' : '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: '#121212',
          color: '#ffffff',
        },
      }}
    >
      <AppBar
        position="relative"
        color="default"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          bgcolor: '#1e1e1e',
          color: 'white',
        }}
      >
        <Toolbar variant="dense">
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <Close />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Photo Editor
          </Typography>
          <Button
            color="primary"
            variant="contained"
            onClick={handleSave}
            disabled={saving || loading}
            startIcon={<Save />}
            sx={{ fontWeight: 'bold' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Grid container sx={{ flex: 1, height: '100%' }}>
          {/* --- LEFT: CANVAS AREA --- 
            Isolated in memoized component to prevent re-renders on slider move 
          */}
          <MemoizedCropperStage
            ref={editorContainerRef}
            loading={loading}
            optimizedSrc={optimizedSrc}
            aspect={aspect}
            cropShape={cropShape}
            onCropperInit={(ref) => {
              cropperRef.current = ref;
            }}
          />

          {/* --- RIGHT: CONTROLS SIDEBAR --- */}
          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{
              height: { xs: '50%', md: '100%' },
              overflowY: 'auto',
              bgcolor: '#1e1e1e',
              borderTop: { xs: 1, md: 0 },
              borderColor: 'rgba(255,255,255,0.1)',
              pointerEvents: loading ? 'none' : 'auto',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* 1. Transform Section */}
              <Box>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  fontWeight="bold"
                  display="block"
                  mb={2}
                >
                  Transform
                </Typography>

                {!lockAspectRatio && (
                  <Box mb={2}>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      {ASPECT_RATIOS.map((r) => (
                        <Chip
                          key={r.label}
                          label={r.label}
                          clickable
                          size="small"
                          variant={
                            (r.value === undefined && aspect === undefined) || aspect === r.value
                              ? 'filled'
                              : 'outlined'
                          }
                          color="primary"
                          onClick={() => setAspect(r.value)}
                          sx={{ borderColor: 'rgba(255,255,255,0.2)' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                <Grid container spacing={1}>
                  <Grid size={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="inherit"
                      onClick={() => rotateImage(-90)}
                    >
                      <RotateLeft />
                    </Button>
                  </Grid>
                  <Grid size={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="inherit"
                      onClick={() => rotateImage(90)}
                    >
                      <RotateRight />
                    </Button>
                  </Grid>
                  <Grid size={3}>
                    <Button
                      fullWidth
                      variant={flipState.h ? 'contained' : 'outlined'}
                      color="inherit"
                      onClick={() => flipImage('h')}
                    >
                      <Flip />
                    </Button>
                  </Grid>
                  <Grid size={3}>
                    <Button
                      fullWidth
                      variant={flipState.v ? 'contained' : 'outlined'}
                      color="inherit"
                      onClick={() => flipImage('v')}
                    >
                      <Flip sx={{ transform: 'rotate(90deg)' }} />
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }} />

              {/* 2. Adjustments Section */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Tune fontSize="small" color="primary" />
                  <Typography variant="overline" color="text.secondary" fontWeight="bold">
                    Adjustments
                  </Typography>
                </Box>

                <Stack spacing={3}>
                  <FilterControl
                    label="Brightness"
                    field="brightness"
                    value={filters.brightness}
                    icon={<Brightness6 fontSize="small" />}
                  />
                  <FilterControl
                    label="Contrast"
                    field="contrast"
                    value={filters.contrast}
                    icon={<Contrast fontSize="small" />}
                  />
                  <FilterControl
                    label="Saturation"
                    field="saturation"
                    value={filters.saturation}
                    icon={<InvertColors fontSize="small" />}
                  />
                </Stack>
              </Box>

              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<Refresh />}
                  onClick={handleReset}
                >
                  Reset All Changes
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
