import { RNGAuthContextProvider } from '@/features/auth/components/AuthContext';
import { getCurrentUser } from '@/features/auth/session';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import type { Metadata } from 'next';
import { RootProvider } from './provider';

export const metadata: Metadata = {
  title: 'RNG App',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <RNGAuthContextProvider user={sessionUser}>
          <RootProvider>{children}</RootProvider>
        </RNGAuthContextProvider>
      </body>
    </html>
  );
}
