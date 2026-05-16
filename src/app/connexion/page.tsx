import { Suspense } from "react";
import { ConnexionForm } from "./connexion-form";

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-zinc-500">
          Chargement…
        </div>
      }
    >
      <ConnexionForm />
    </Suspense>
  );
}
