export type ValidationStatus =
  | "pending"
  | "pending_temp"
  | "approved"
  | "rejected"
  | null;

export type DriverStatus =
  | "pending_validation"
  | "active"
  | "inactive"
  | "on_vacation"
  | "suspended"
  | "incomplete";

export interface DriverDocument {
  id: string;
  driver_id?: string | null;
  document_type: string;
  file_url: string;
  file_name?: string | null;
  file_size?: number | null;
  upload_date?: string | null;
  created_at?: string | null;
  expiry_date?: string | null;
  validation_status?: ValidationStatus;
  rejection_reason?: string | null;
  validated_by?: string | null;
  validated_at?: string | null;
  temp?: boolean;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  status: DriverStatus;
  document_urls?: Record<string, string> | null;
}
