// src/app/types/database.ts

export type UserRole = 'admin' | 'sub_admin' | 'regular_user';
export type DocStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido' | 'No Cumple';
export type TaskPriority = 'Baja' | 'Estándar' | 'Urgente' | 'Crítico';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department_id: string | null;
  is_active: boolean;
  avatar_url?: string;
  last_seen_at?: string; // New: For Online/Offline status
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  document_type: string;
  articulo?: string; 
  department_id: string;
  current_status: DocStatus;
  uploaded_by_user_id: string | null;
  storage_path: string | null;
  rejection_comment?: string | null;
  due_date?: string | null; 
  master_id?: string | null; // Link to cyclic rule
  created_at: string;
  updated_at: string;
}

export interface DocumentMasterMatrix {
  id: string;
  title: string;
  description: string | null;
  department_id: string;
  assigned_to_profile_id: string | null;
  frequency: 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANUAL' | 'UNICA';
  standard_due_time: string;
  template_storage_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithDetails extends Document {
  uploader?: {
    first_name: string;
    last_name: string;
  };
  department?: {
    name: string;
  };
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  storage_path: string;
  uploaded_by_user_id: string;
  reason_for_change: string; 
  version_number: number;
  created_at: string;
}

export interface Permission {
  id: string;
  user_id: string;
  department_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_approve: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to_user_id: string;
  requester_id: string; 
  department_id: string;
  due_date: string;
  status: DocStatus;
  priority: TaskPriority;
  requires_document: boolean;
  instruction_file_path?: string; 
  resolution_file_path?: string; 
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action_type: string; 
  resource_type: string; 
  resource_id: string;
  details: any; 
  justification?: string;
  timestamp: string;
}

export interface KPI {
  id: string;
  kpi_name: string;
  value: number;
  unit: string; 
  date_recorded: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id?: string; 
  rut: string;
  first_name: string;
  last_name: string;
  cargo: string;
  centro_costos: string;
  entry_date: string;
  status: 'Vinculado' | 'En Suspensión' | 'Desvinculado';
  comments?: string;
  cv_storage_path?: string;
  certificates_storage_path?: string;
  created_at: string;
  updated_at: string;
}

export interface Deadline {
  id: string;
  name: string;
  description?: string;
  due_date: string;
  recurrence?: 'Sin recurrencia' | 'Mensual' | 'Semanal';
  type: 'Financiero' | 'Cumplimiento' | 'Impuesto';
  created_at: string;
  updated_at: string;
}
