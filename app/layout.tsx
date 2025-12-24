import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import type { Metadata } from 'next';
import AppProvider from './provider';

export const metadata: Metadata = {
  title: 'RNG App',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
