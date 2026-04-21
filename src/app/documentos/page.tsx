import { createClient } from '@/utils/supabase/server'
import DocumentMatrixClient from '@/components/features/documents/DocumentMatrixClient'
import { DocStatus, DocumentWithDetails } from '@/app/types/database'

export default async function DocumentosPage() {
  const supabase = await createClient()

  // 1. Fetch real documents with uploader details
  const { data: documents } = await supabase
    .from('documents')
    .select(`
      *,
      uploader:profiles!uploaded_by_user_id (first_name, last_name),
      department:departments (name)
    `)
    .order('created_at', { ascending: false })

  // 2. Fetch departments for the upload modal
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .order('name', { ascending: true })

  // 3. Calculate real stats
  const { data: allDocs } = await supabase
    .from('documents')
    .select('current_status')

  const counts: Record<DocStatus, number> = {
    'Pendiente': 0,
    'Aprobado': 0,
    'Rechazado': 0,
    'Vencido': 0,
    'No Cumple': 0,
  }

  allDocs?.forEach(doc => {
    if (doc.current_status in counts) {
      counts[doc.current_status as DocStatus]++
    }
  })

  const stats = [
    { label: 'PENDIENTE (EN REVISIÓN)', count: counts['Pendiente'], status: 'Pendiente' as DocStatus },
    { label: 'NO CUMPLE', count: counts['No Cumple'], status: 'No Cumple' as DocStatus },
    { label: 'VENCIDO', count: counts['Vencido'], status: 'Vencido' as DocStatus },
    { label: 'RECHAZADO', count: counts['Rechazado'], status: 'Rechazado' as DocStatus },
    { label: 'APROBADO', count: counts['Aprobado'], status: 'Aprobado' as DocStatus },
  ]

  return (
    <DocumentMatrixClient 
      initialDocuments={(documents as any) || []} 
      stats={stats}
      departments={departments || []}
    />
  )
}
