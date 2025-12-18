'use client';

import { Box, Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

const DEMOS = [
  {
    title: 'Basic Inputs',
    description: 'Text, Numbers, Date, and standard form controls validation.',
    path: '/playground/basic',
  },
  {
    title: 'Advanced Layouts',
    description: 'Sections, Tabs, Wizards, and Accordions.',
    path: '/playground/layouts',
  },
  {
    title: 'Logic & Dependencies',
    description: 'Test conditional rendering and dynamic props in real-time.',
    path: '/playground/logic',
  },
];

export default function PlaygroundHome() {
  const router = useRouter();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        RNG Form Playground
      </Typography>

      <Grid container spacing={3}>
        {DEMOS.map((demo) => (
          <Grid key={demo.path} size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }} variant="outlined">
              <CardActionArea onClick={() => router.push(demo.path)} sx={{ height: '100%', p: 2 }}>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    {demo.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {demo.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
