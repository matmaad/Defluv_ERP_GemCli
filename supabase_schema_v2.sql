-- SUPABASE SQL MIGRATION - DEFLUV ERP V2
-- Execute this in your Supabase SQL Editor to synchronize the schema.

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update Departments (if exists)
CREATE TABLE IF NOT EXISTS departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update Profiles/Users
-- Note: Supabase uses auth.users, so we map metadata to a public profiles table.
-- Changed user_id to id as per user request.
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'regular_user' CHECK (role IN ('admin', 'sub_admin', 'regular_user')),
    department_id UUID REFERENCES departments(department_id),
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    document_type TEXT,
    articulo TEXT, -- Mandatory for MOP contracts
    department_id UUID REFERENCES departments(department_id),
    responsible_user_id UUID REFERENCES profiles(id),
    current_status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (current_status IN ('Pendiente', 'Aprobado', 'Rechazado', 'Vencido', 'No Cumple')),
    uploaded_by_user_id UUID REFERENCES profiles(id),
    last_modified_at TIMESTAMPTZ DEFAULT now(),
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    rejection_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Document Versions
CREATE TABLE IF NOT EXISTS document_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(document_id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    uploaded_by_user_id UUID REFERENCES profiles(id),
    reason_for_change TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Permissions Table (Access Control Matrix)
CREATE TABLE IF NOT EXISTS permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(department_id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, department_id)
);

-- 7. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_user_id UUID REFERENCES profiles(id),
    requester_id UUID REFERENCES profiles(id),
    department_id UUID REFERENCES departments(department_id),
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Aprobado', 'Rechazado', 'Vencido', 'No Cumple')),
    priority TEXT DEFAULT 'Estándar' CHECK (priority IN ('Baja', 'Estándar', 'Urgente', 'Crítico')),
    instruction_file_path TEXT,
    resolution_file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    justification TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 9. KPI Table
CREATE TABLE IF NOT EXISTS kpis (
    kpi_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT,
    date_recorded DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Personal Records
CREATE TABLE IF NOT EXISTS personal_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    rut TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    entry_date DATE NOT NULL,
    status TEXT DEFAULT 'Vinculado' CHECK (status IN ('Vinculado', 'En Suspensión', 'Desvinculado')),
    comments TEXT,
    cv_storage_path TEXT,
    certificates_storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Deadlines Table
CREATE TABLE IF NOT EXISTS deadlines (
    deadline_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    recurrence TEXT CHECK (recurrence IN ('Sin recurrencia', 'Mensual', 'Semanal')),
    type TEXT CHECK (type IN ('Financiero', 'Cumplimiento', 'Impuesto')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Row Level Security (RLS)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Helper function to check if user is admin (optional but cleaner)
-- Using direct lookup in policies for simplicity in this script

-- Departments
CREATE POLICY "Allow authenticated read on departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all on departments" ON departments FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profiles
CREATE POLICY "Allow authenticated read on profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow admin all on profiles" ON profiles FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Documents
CREATE POLICY "Allow authenticated read on documents" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all on documents" ON documents FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Document Versions
CREATE POLICY "Allow authenticated read on document_versions" ON document_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all on document_versions" ON document_versions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Permissions
CREATE POLICY "Allow authenticated read on permissions" ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all on permissions" ON permissions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tasks
CREATE POLICY "Allow authenticated read on tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all on tasks" ON tasks FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Audit Logs
CREATE POLICY "Allow authenticated read on audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all on audit_logs" ON audit_logs FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- KPIs
CREATE POLICY "Allow authenticated read on kpis" ON kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all on kpis" ON kpis FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Personal Records
CREATE POLICY "Allow authenticated read on personal_records" ON personal_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all on personal_records" ON personal_records FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Deadlines
CREATE POLICY "Allow authenticated read on deadlines" ON deadlines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all on deadlines" ON deadlines FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 13. Functions & Triggers (Update updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_personal_records_updated_at BEFORE UPDATE ON personal_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON deadlines FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
