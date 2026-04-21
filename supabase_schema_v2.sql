-- SUPABASE SQL MIGRATION - DEFLUV ERP V2 (REFINED)
-- Execute this in your Supabase SQL Editor to synchronize the schema.

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update Profiles/Users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'regular_user' CHECK (role IN ('admin', 'sub_admin', 'regular_user')),
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    document_type TEXT,
    articulo TEXT, -- Mandatory for MOP contracts
    department_id UUID REFERENCES departments(id),
    responsible_user_id UUID REFERENCES profiles(id),
    current_status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (current_status IN ('Pendiente', 'Aprobado', 'Rechazado', 'Vencido', 'No Cumple')),
    uploaded_by_user_id UUID REFERENCES profiles(id),
    last_modified_at TIMESTAMPTZ DEFAULT now(),
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    rejection_comment TEXT,
    due_date TIMESTAMPTZ, -- Deadline for upload
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Document Versions
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    uploaded_by_user_id UUID REFERENCES profiles(id),
    reason_for_change TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Permissions Table (Access Control Matrix)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, department_id)
);

-- 7. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_user_id UUID REFERENCES profiles(id),
    requester_id UUID REFERENCES profiles(id),
    department_id UUID REFERENCES departments(id),
    due_date TIMESTAMPTZ, -- Optional deadline
    status TEXT DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Aprobado', 'Rechazado', 'Vencido', 'No Cumple')),
    priority TEXT DEFAULT 'Estándar' CHECK (priority IN ('Baja', 'Estándar', 'Urgente', 'Crítico')),
    instruction_file_path TEXT,
    resolution_file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT, -- Changed to TEXT for compatibility
    details JSONB,
    justification TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 9. KPI Table
CREATE TABLE IF NOT EXISTS kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT,
    date_recorded DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Personal Records
CREATE TABLE IF NOT EXISTS personal_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    rut TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    cargo TEXT,
    centro_costos TEXT,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    recurrence TEXT CHECK (recurrence IN ('Sin recurrencia', 'Mensual', 'Semanal')),
    type TEXT CHECK (type IN ('Financiero', 'Cumplimiento', 'Impuesto')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Row Level Security (RLS) & Policies
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

-- Helper function to check admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- General read policies (all authenticated users)
CREATE POLICY "Allow auth read departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth read documents" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth read document_versions" ON document_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth read permissions" ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth read tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth read audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth read kpis" ON kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth read personal_records" ON personal_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth read deadlines" ON deadlines FOR SELECT TO authenticated USING (true);

-- Admin policies (Full access)
CREATE POLICY "Admin full departments" ON departments FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full profiles" ON profiles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full documents" ON documents FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full document_versions" ON document_versions FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full permissions" ON permissions FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full tasks" ON tasks FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full audit_logs" ON audit_logs FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full kpis" ON kpis FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full personal_records" ON personal_records FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full deadlines" ON deadlines FOR ALL TO authenticated USING (public.is_admin());

-- Specialized policies
CREATE POLICY "Allow users to log actions" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow users to update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

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
