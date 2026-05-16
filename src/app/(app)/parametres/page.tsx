import { getAuthContext } from "@/lib/auth-context";
import { GarageSettingsForm } from "@/components/settings/GarageSettingsForm";

export default async function ParametresPage() {
  const ctx = await getAuthContext();
  if (!ctx) return null;

  return (
    <div className="app-page-narrow">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Configuration
        </p>
        <h1 className="app-heading mt-2">Paramètres du garage</h1>
        <p className="app-subtitle">
          Ces informations apparaissent sur vos factures PDF. Chaque point de
          vente a ses propres paramètres.
        </p>
      </div>
      <GarageSettingsForm garage={ctx.garage} />
    </div>
  );
}
