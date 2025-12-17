'use client';
import { FormBuilder } from '@/rng-form/components/FormBuilder';
import { FormSchema, LayoutItem } from '@/rng-form/types';
import { Box, Grid, Tab, Tabs } from '@mui/material';
import { useState } from 'react';

interface TabsLayoutProps<S extends FormSchema> {
  item: LayoutItem<S> & { type: 'tabs' };
  pathPrefix?: string;
}

export function RNGTabsLayout<S extends FormSchema>({ item, pathPrefix }: TabsLayoutProps<S>) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Grid size={item.colProps?.size ?? 12} {...item.colProps}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable">
            {item.tabs.map((tab, idx) => (
              <Tab key={idx} label={tab.label} />
            ))}
          </Tabs>
        </Box>
        {item.tabs.map((tab, idx) => (
          <div role="tabpanel" hidden={activeTab !== idx} key={idx} style={{ padding: '16px 0' }}>
            {activeTab === idx && <FormBuilder uiSchema={tab.children} pathPrefix={pathPrefix} />}
          </div>
        ))}
      </Box>
    </Grid>
  );
}
