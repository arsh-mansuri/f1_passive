import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/archivo-black/latin.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PitWall — The race, at a glance.",
    template: "%s · PitWall",
  },
  description:
    "An ambient F1 race replayer. Real positions, real overtakes, AI commentary, zero video. Built to have the race on while you work.",
  applicationName: "PitWall",
  keywords: ["F1", "Formula 1", "race replay", "timing tower", "ambient"],
  authors: [{ name: "PitWall" }],
  openGraph: {
    title: "PitWall — The race, at a glance.",
    description:
      "Watch any F1 race from 2024 onward as a live timing-tower visualization.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-pit-black text-pit-text antialiased">
        {children}
      </body>
    </html>
  );
}
