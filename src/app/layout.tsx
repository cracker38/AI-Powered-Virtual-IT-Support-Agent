import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const playfair = Playfair_Display({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AVISA - Virtual IT Support Agent",
  description: "Your intelligent virtual IT support companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={playfair.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
