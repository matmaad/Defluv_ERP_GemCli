// types/database.ts

export type UserRole = 'admin' | 'sub_admin' | 'regular_user';
export type DocStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido' | 'No Cumple';

export interface Profile {
  id: string;
  role: UserRole;
  department_id: string | null;
  is_active: boolean;
  avatar_url?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Document {
  id: string;
  title: string;
  code: string;
  articulo: string;
  department_id: string;
  responsible_user_id: string;
  current_status: DocStatus;
  storage_path: string;
  file_name: string;
  rejection_comment?: string;
  deadline?: string;
}

export interface Task {
  id: string;
  title: string;
  reference_code: string;
  department_id: string;
  requester_id: string;
  responsible_user_id: string;
  status: DocStatus;
  instruction_file_path?: string;
  resolution_file_path?: string;
  deadline: string;
}