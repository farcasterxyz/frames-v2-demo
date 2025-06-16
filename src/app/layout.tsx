import type { Metadata } from "next";

import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { Toaster } from "~/components/ui/sonner";

export const metadata: Metadata = {
  title: "DappCon Mini App Template",
  description: "by hellno.eth",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
