// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Affordable Sports Cars",
  description: "Discover the best value sports cars under $200k.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
