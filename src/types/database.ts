export type VehicleStatus =
  | "en stock"
  | "en préparation"
  | "réservé"
  | "vendu"
  | "archivé";

export type InvoiceStatus =
  | "brouillon"
  | "envoyée"
  | "payée"
  | "en retard"
  | "annulée";

export type ProfileRole = "administrateur" | "employé";

export type CustomerType = "particulier" | "entreprise";

export type PaymentStatus = "payé" | "impayé" | "partiel";

export interface Garage {
  id: string;
  name: string;
  legal_name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  canton: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  iban: string | null;
  bank_name: string | null;
  bank_account_holder: string | null;
  vat_number: string | null;
  default_payment_terms: string | null;
  default_invoice_note: string | null;
  default_vat_rate: number | null;
  currency: string;
  invoice_prefix: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  garage_id: string;
  full_name: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  garage_id: string;
  customer_type: CustomerType;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  canton: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  garage_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  version: string | null;
  year: number | null;
  first_registration_date: string | null;
  mileage: number | null;
  fuel_type: string | null;
  transmission: string | null;
  power: string | null;
  color: string | null;
  doors: number | null;
  seats: number | null;
  vin: string | null;
  matricule: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  seller_name: string | null;
  seller_contact: string | null;
  additional_fees: number | null;
  repair_fees: number | null;
  preparation_fees: number | null;
  administrative_fees: number | null;
  total_cost: number | null;
  desired_sale_price: number | null;
  description: string | null;
  internal_notes: string | null;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface VehiclePhoto {
  id: string;
  garage_id: string;
  vehicle_id: string;
  file_url: string;
  file_path: string;
  sort_order: number;
  created_by: string | null;
  created_at: string;
}

export interface VehicleDocument {
  id: string;
  garage_id: string;
  vehicle_id: string;
  document_name: string;
  document_type: string | null;
  file_url: string;
  file_path: string;
  created_at: string;
}

export interface Sale {
  id: string;
  garage_id: string;
  vehicle_id: string;
  customer_id: string;
  sale_date: string;
  sale_price: number;
  purchase_price: number | null;
  total_cost: number | null;
  profit: number | null;
  profit_percentage: number | null;
  payment_method: string | null;
  payment_status: PaymentStatus | null;
  warranty: string | null;
  notes: string | null;
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  garage_id: string;
  customer_id: string | null;
  vehicle_id: string | null;
  sale_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  subtotal: number;
  vat_rate: number | null;
  vat_amount: number | null;
  total: number;
  amounts_include_vat: boolean;
  notes: string | null;
  payment_terms: string | null;
  pdf_url: string | null;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  garage_id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}
