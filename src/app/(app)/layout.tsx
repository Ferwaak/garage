import { getAuthContext } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthContext();
  if (!ctx) {
    /* Évite la boucle avec le middleware (connecté → /connexion → /tableau-de-bord). */
    redirect("/configuration-requise");
  }

  return (
    <AppShell garageName={ctx.garage.name} garageLogoUrl={ctx.garage.logo_url}>
      {children}
    </AppShell>
  );
}
