import { Box, Skeleton, Stack } from '@mui/material';

export default function DashboardLoading() {
  return (
    <Box sx={{ p: 3, width: '100%' }}>
      {/* Header Skeleton */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
      </Stack>

      {/* Content Grid Skeleton */}
      <Stack spacing={3}>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
        </Stack>
      </Stack>
    </Box>
  );
}
