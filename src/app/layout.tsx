import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import Script from "next/script";
import { getSupabaseRuntimeConfig } from "@/lib/supabase/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Logiciel",
  description: "Gestion de garage automobile",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Logiciel",
  },
};

export const viewport: Viewport = {
  themeColor: "#094d42",
  width: "device-width",
  initialScale: 1,
};

function serializeForInlineScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  const supabaseRuntimeConfig = getSupabaseRuntimeConfig();

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[var(--background)] text-zinc-900"
      >
        <Script id="supabase-runtime-config" strategy="beforeInteractive">
          {`window.__GARAGE_AZ_SUPABASE__=${serializeForInlineScript(
            supabaseRuntimeConfig
          )};`}
        </Script>
        <Script id="strip-extension-hydration-attrs" strategy="beforeInteractive">
          {`
            (() => {
              const strip = (root = document) => {
                root.querySelectorAll?.("*").forEach((node) => {
                  for (const attr of Array.from(node.attributes || [])) {
                    if (
                      attr.name.startsWith("bis_") ||
                      attr.name.startsWith("__processed_")
                    ) {
                      node.removeAttribute(attr.name);
                    }
                  }
                });
              };

              strip();
              const observer = new MutationObserver(() => strip());
              observer.observe(document.documentElement, {
                subtree: true,
                attributes: true,
              });
              window.addEventListener("load", () => {
                strip();
                window.setTimeout(() => observer.disconnect(), 1500);
              });
            })();
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
