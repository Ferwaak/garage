"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignedStorageImage } from "@/components/media/SignedStorageImage";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  CarFront,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Search,
  Settings,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/vehicules", label: "Véhicules", icon: CarFront },
  { href: "/vehicules-vendus", label: "Véhicules vendus", icon: WalletCards },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/factures", label: "Factures", icon: ReceiptText },
  { href: "/parametres", label: "Paramètres", icon: Settings },
  { href: "/recherche", label: "Recherche", icon: Search },
];

function BrandMark({
  logoUrl,
  size,
}: {
  logoUrl?: string | null;
  size: "sm" | "lg";
}) {
  const frameClass = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconClass = size === "lg" ? "h-6 w-6" : "h-5 w-5";

  if (logoUrl) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden",
          frameClass
        )}
      >
        {logoUrl.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-full w-full object-contain"
            loading="eager"
          />
        ) : (
          <SignedStorageImage
            bucket="garage-logos"
            path={logoUrl}
            alt=""
            className="h-full w-full object-contain"
          />
        )}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-white shadow-sm",
        frameClass
      )}
    >
      <Gauge className={iconClass} />
    </span>
  );
}

export function AppShell({
  garageName,
  garageLogoUrl,
  children,
}: {
  garageName: string;
  garageLogoUrl?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/connexion");
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[var(--background)] text-neutral-950 md:pl-[292px]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200/80 bg-white/92 px-4 py-3 backdrop-blur md:hidden">
        <Link
          href="/tableau-de-bord"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <BrandMark logoUrl={garageLogoUrl} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-neutral-950">
              {garageName}
            </span>
            <span className="block text-xs text-neutral-500">Console vente auto</span>
          </span>
        </Link>
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 shadow-sm"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-dvh w-72 shrink-0 flex-col border-r border-white/10 bg-[#111713] text-white shadow-2xl md:w-[292px] md:shadow-none",
          open ? "flex" : "hidden md:flex"
        )}
      >
        <div className="border-b border-white/10 p-5">
          <Link
            href="/tableau-de-bord"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <BrandMark logoUrl={garageLogoUrl} size="lg" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {garageName}
              </span>
              <span className="block text-xs text-neutral-400">
                Gestion automobile
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-neutral-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                      : "bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <LogOut className="h-4 w-4" />
            </span>
            Déconnexion
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/35 backdrop-blur-[1px] md:hidden"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="min-w-0 max-w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_right,rgba(14,111,92,0.10),transparent_30%),linear-gradient(180deg,#f8f9f6_0%,#f4f5f2_260px)] px-4 py-5 md:px-8 md:py-8 xl:px-10">
        {children}
      </main>
    </div>
  );
}
