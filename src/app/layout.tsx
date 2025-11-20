import type { Metadata } from "next";
import '@teable/ui-lib/dist/global.shadcn.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Barcode & QR Code Generator',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
