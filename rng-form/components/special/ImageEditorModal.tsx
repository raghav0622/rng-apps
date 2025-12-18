'use client';

import { applyFiltersAndSave } from '@/rng-form/utils/image-processing';
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
import { Cropper, ImageRestriction } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';

// --- Types ---

interface ImageEditorModalProps {
  open: boolean;
  src: string | null;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
  aspectRatio?: number;
  lockAspectRatio?: boolean;
  cropShape?: 'rect' | 'round';
}

interface FilterState {
  brightness: number;
  contrast: number;
  saturation: number;
}

const DEFAULT_FILTERS: FilterState = {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cropperRef = useRef<any>(null);

  // Ref for the container to apply CSS variables directly (Performance Fix)
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // --- State ---
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [saving, setSaving] = useState(false);
  const [aspect, setAspect] = useState<number | undefined>(initialAspectRatio);
  const [flipState, setFlipState] = useState({ h: false, v: false });

  // Reset on open
  useEffect(() => {
    if (open) {
      setFilters(DEFAULT_FILTERS);
      setAspect(initialAspectRatio);
      setFlipState({ h: false, v: false });
    }
  }, [open, src, initialAspectRatio]);

  // --- PERFORMANCE: Update CSS Variables Directly ---
  // This avoids re-rendering the heavy Cropper component when sliders move.
  useEffect(() => {
    if (editorContainerRef.current) {
      const el = editorContainerRef.current;
      el.style.setProperty('--brightness', `${filters.brightness}%`);
      el.style.setProperty('--contrast', `${filters.contrast}%`);
      el.style.setProperty('--saturation', `${filters.saturation}%`);
    }
  }, [filters]);

  // --- Handlers ---

  const handleSave = async () => {
    if (!cropperRef.current || !src) return;

    setSaving(true);
    try {
      // 1. Get Geometry-Corrected Canvas
      const canvas = cropperRef.current.getCanvas();
      if (!canvas) throw new Error('Could not create canvas');

      // 2. Apply Filters (Brightness/Contrast) and Save
      const file = await applyFiltersAndSave(canvas, filters, `edited_${Date.now()}.jpg`);

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
    setAspect(initialAspectRatio);
    setFlipState({ h: false, v: false });
    cropperRef.current?.reset();
  };

  // --- UI Components ---

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
    field: keyof FilterState;
    min?: number;
    max?: number;
  }) => {
    const handleChange = (newVal: number) => {
      setFilters((prev) => ({ ...prev, [field]: newVal }));
    };

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
              onChange={(_, v) => handleChange(v as number)}
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
                if (!isNaN(num)) handleChange(num);
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
          bgcolor: '#121212', // Force dark background for editor
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
            disabled={saving}
            startIcon={<Save />}
            sx={{ fontWeight: 'bold' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Grid container sx={{ flex: 1, height: '100%' }}>
          {/* --- LEFT: CANVAS AREA --- */}
          <Grid
            size={{ xs: 12, md: 9 }}
            ref={editorContainerRef}
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
              // The CSS Variables are injected here by the useEffect above
            }}
          >
            {src && (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  // Target the internal image of react-advanced-cropper
                  // Use variables for zero-latency updates
                  '& .rac-image': {
                    filter: `
                      brightness(var(--brightness, 100%)) 
                      contrast(var(--contrast, 100%)) 
                      saturate(var(--saturation, 100%))
                    `,
                    transition: 'filter 0.1s linear',
                    willChange: 'filter',
                  },
                }}
              >
                {}
                <Cropper
                  ref={cropperRef}
                  src={src}
                  className={'cropper'}
                  stencilProps={{
                    aspectRatio: aspect,
                    grid: true,
                    // Fix: Ensure we don't pass undefined class if round is not active
                    previewClassName: cropShape === 'round' ? 'circle-preview' : undefined,
                  }}
                  style={{ height: '100%', width: '100%', outline: 'none' }}
                  imageRestriction={ImageRestriction.stencil}
                />

                {/* Circular Mask Styles */}
                {cropShape === 'round' && (
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                    .circle-preview {
                      border-radius: 50%;
                      cursor: move;
                      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85);
                    }
                  `,
                    }}
                  />
                )}
              </Box>
            )}
          </Grid>

          {/* --- RIGHT: CONTROLS SIDEBAR --- */}
          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{
              height: { xs: '50%', md: '100%' },
              overflowY: 'auto',
              bgcolor: '#1e1e1e', // Dark Sidebar
              borderTop: { xs: 1, md: 0 },
              borderColor: 'rgba(255,255,255,0.1)',
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
