import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeliVid — Audio to Video",
  description: "Turn your audio into a beautiful static video, ready for YouTube.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
