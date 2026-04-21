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
  document_type: string; // e.g., 'Protocolo', 'Manual', 'Plano'
  articulo?: string; // Mandatory for MOP contracts
  department_id: string;
  responsible_user_id: string;
  current_status: DocStatus;
  uploaded_by_user_id: string;
  last_modified_at: string;
  storage_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  rejection_comment?: string; // For 'Rechazado' state
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  storage_path: string;
  uploaded_by_user_id: string;
  reason_for_change: string; // Mandatory justification
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
  requester_id: string; // Sub-Admin or Admin
  department_id: string;
  due_date: string;
  status: DocStatus;
  priority: TaskPriority;
  instruction_file_path?: string; // From requester
  resolution_file_path?: string; // From assignee
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action_type: string; // 'document_upload', 'document_replace', 'permission_change', etc.
  resource_type: string; // 'document', 'user', 'permission'
  resource_id: string;
  details: any; // JSON object for diffs
  justification?: string;
  timestamp: string;
}

export interface KPI {
  id: string;
  kpi_name: string;
  value: number;
  unit: string; // '%', 'count', etc.
  date_recorded: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id?: string; // Link to profile if they are a system user
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
