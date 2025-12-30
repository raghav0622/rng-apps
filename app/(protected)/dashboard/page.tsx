'use client';
import { RNGPage } from '@/rng-ui/layouts/RNGPage';
import { Box, Button, Card, CardContent, Grid, Typography } from '@mui/material';
import { Assignment, Business, Dashboard as DashboardIcon } from '@mui/icons-material';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <RNGPage 
      title="Dashboard" 
      description="Welcome to your organization overview."
    >
      <Grid container spacing={3}>
        {/* Quick Navigation Cards */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Assignment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5">Tasks</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Manage and track your tasks with collaborative workflows, file attachments, and review cycles.
              </Typography>
              <Button 
                component={Link} 
                href="/tasks" 
                variant="contained" 
                fullWidth
              >
                Go to Tasks
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Business sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5">Entities</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Manage clients, vendors, and other business entities with full CRUD operations.
              </Typography>
              <Button 
                component={Link} 
                href="/entities" 
                variant="contained" 
                fullWidth
              >
                Go to Entities
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DashboardIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5">Overview</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                View analytics, reports, and insights about your organization's activities.
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </RNGPage>
  );
}
