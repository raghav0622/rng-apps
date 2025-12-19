// app/dashboard/profile/loading.tsx
import { Card, CardContent, CardHeader, Skeleton, Stack } from '@mui/material';

export default function ProfileLoading() {
  return (
    <Stack spacing={4}>
      <Card>
        <CardHeader title={<Skeleton width="30%" />} subheader={<Skeleton width="50%" />} />
        <CardContent>
          <Stack spacing={3}>
            {/* Simulating Form Fields */}
            <Skeleton variant="rectangular" height={56} />
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={64} height={64} />
              <Skeleton variant="rectangular" width={120} height={36} />
            </Stack>
            <Skeleton variant="rectangular" width={150} height={40} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={<Skeleton width="20%" />} subheader={<Skeleton width="40%" />} />
        <CardContent>
          <Stack direction="row" justifyContent="space-between">
            <Skeleton variant="rectangular" width={150} height={36} />
            <Skeleton variant="rectangular" width={150} height={36} />
          </Stack>
          <Skeleton variant="rectangular" height={50} sx={{ mt: 3 }} />
        </CardContent>
      </Card>
    </Stack>
  );
}
