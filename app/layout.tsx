import RootProvider from '@/ui/layout/RootProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RNG Apps',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
