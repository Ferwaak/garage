import { z } from "zod";

/** Valeurs du formulaire véhicule (saisie interface) */
export type VehicleFormValues = {
  name: string;
  brand?: string;
  model?: string;
  version?: string;
  year?: number | string;
  mileage?: number | string;
  fuel_type?: string;
  transmission?: string;
  power?: string;
  color?: string;
  doors?: number | string;
  seats?: number | string;
  vin?: string;
  matricule?: string;
  purchase_date?: string | null;
  purchase_price?: number | string;
  seller_name?: string;
  seller_contact?: string;
  additional_fees?: number | string;
  repair_fees?: number | string;
  preparation_fees?: number | string;
  administrative_fees?: number | string;
  desired_sale_price?: number | string;
  description?: string;
  status?: "en stock" | "en préparation" | "réservé" | "vendu" | "archivé";
};

/** Schéma optionnel pour validations futures (API, tests) */
export const vehicleFormSchema = z.object({
  name: z.string().min(1),
});
