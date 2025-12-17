'use client';
import { Box, Grid, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { FormSchema, TabsItem } from '../../types';
import { FormBuilder } from '../FormBuilder';

export function RNGTabsLayout<S extends FormSchema>({
  item,
  pathPrefix,
}: {
  item: TabsItem<S>;
  pathPrefix?: string;
}) {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto">
          {item.tabs.map((tab, index) => (
            <Tab
              label={tab.label}
              key={index}
              id={`tab-${index}`}
              aria-controls={`tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Box>
      {item.tabs.map((tab, index) => (
        <div
          role="tabpanel"
          hidden={value !== index}
          id={`tabpanel-${index}`}
          aria-labelledby={`tab-${index}`}
          key={index}
          style={{ paddingTop: 20, paddingBottom: 10 }}
        >
          {value === index && (
            <Grid container spacing={2}>
              <FormBuilder uiSchema={tab.children} pathPrefix={pathPrefix} />
            </Grid>
          )}
        </div>
      ))}
    </Box>
  );
}
