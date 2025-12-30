import { Container, Paper, Skeleton, Stack } from '@mui/material';

export default function EntityDetailLoading() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Back Button Skeleton */}
      <Skeleton variant="text" width={100} height={40} sx={{ mb: 3 }} />

      {/* Title Skeleton */}
      <Skeleton variant="text" width="50%" height={50} sx={{ mb: 4 }} />

      {/* Form Skeleton */}
      <Paper sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={100} />
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Skeleton variant="rectangular" width={100} height={40} />
            <Skeleton variant="rectangular" width={100} height={40} />
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
