import { Box, Container, Grid, Paper, Skeleton, Stack } from '@mui/material';

export default function TaskDetailLoading() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back Button Skeleton */}
      <Skeleton variant="text" width={100} height={40} sx={{ mb: 3 }} />

      {/* Title Skeleton */}
      <Skeleton variant="text" width="60%" height={50} sx={{ mb: 4 }} />

      <Grid container spacing={3}>
        {/* Left Column - Task Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Task Info Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
              <Skeleton variant="text" width="40%" height={30} />
              <Skeleton variant="rectangular" height={100} />
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={80} height={32} />
                <Skeleton variant="rounded" width={80} height={32} />
                <Skeleton variant="rounded" width={80} height={32} />
              </Stack>
            </Stack>
          </Paper>

          {/* Tabs Skeleton */}
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <Skeleton variant="rectangular" width={100} height={40} />
              <Skeleton variant="rectangular" width={100} height={40} />
            </Stack>
            <Stack spacing={2}>
              {[1, 2, 3].map((item) => (
                <Box key={item}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="100%" height={60} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column - Action Panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width="60%" height={30} sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <Skeleton variant="rectangular" height={100} />
              <Skeleton variant="rectangular" height={50} />
              <Skeleton variant="rectangular" height={40} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
