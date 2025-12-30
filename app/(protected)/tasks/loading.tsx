import { Box, Container, Grid, Skeleton, Stack } from '@mui/material';

export default function TasksLoading() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Skeleton */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" width={120} height={40} />
      </Stack>

      {/* Filter/Sort Bar Skeleton */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Skeleton variant="rectangular" width={200} height={56} />
        <Skeleton variant="rectangular" width={200} height={56} />
        <Skeleton variant="rectangular" width={150} height={56} />
      </Stack>

      {/* Task Cards Skeleton */}
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Grid key={item} size={{ xs: 12, md: 6, lg: 4 }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 3 }}>
              <Stack spacing={2}>
                <Skeleton variant="text" width="80%" height={30} />
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="100%" height={20} />
                <Stack direction="row" spacing={1}>
                  <Skeleton variant="rounded" width={80} height={24} />
                  <Skeleton variant="rounded" width={80} height={24} />
                </Stack>
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
