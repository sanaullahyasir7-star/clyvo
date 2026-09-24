import type { Metadata } from "next";
import { AppProvider } from "@/providers/app";
import "./globals.css";
export const metadata: Metadata = {
  title: "CLYVO — Be ready for every conversation",
  description:
    "Local-first conversation preparation, live assistance, memory and review.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
