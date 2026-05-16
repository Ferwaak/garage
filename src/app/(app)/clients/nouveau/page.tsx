import { getAuthContext } from "@/lib/auth-context";
import { ClientForm } from "@/components/clients/ClientForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NouveauClientPage() {
  const ctx = await getAuthContext();
  if (!ctx) return null;

  return (
    <div className="app-page-narrow">
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux clients
      </Link>
      <div>
        <p className="app-kicker">Nouveau contact</p>
        <h1 className="app-heading mt-2">Créer un client</h1>
        <p className="app-subtitle">
          Ajoutez un acheteur particulier ou une entreprise avant une vente ou
          une facture.
        </p>
      </div>
      <ClientForm garageId={ctx.garage.id} />
    </div>
  );
}
