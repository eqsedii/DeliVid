import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Splash from "@/components/Splash";
import VideoBackground from "@/components/VideoBackground";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "DeliVid — Audio to Video",
  description: "Turn your audio into a beautiful video, ready for YouTube.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <VideoBackground />
        <Splash />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
