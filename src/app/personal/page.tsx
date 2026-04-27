import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import PersonnelClient from '@/components/features/personnel/PersonnelClient'
import { Profile, PersonalRecord, Department } from '@/app/types/database'

function PersonnelSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 bg-gray-200 rounded-xl w-64"></div>
        <div className="h-10 bg-[#0a2d4d]/10 rounded-xl w-48"></div>
      </div>
      <div className="h-[500px] bg-white border border-gray-100 rounded-2xl shadow-sm"></div>
    </div>
  )
}

async function PersonnelDataLayer({ profile }: { profile: Pick<Profile, 'role' | 'department_id'> | null }) {
  const supabase = await createClient()

  const [departmentsResult, recordsResult] = await Promise.all([
    supabase.from('departments').select('*').order('name', { ascending: true }),
    (profile?.role === 'regular_user' && profile.department_id)
      ? supabase.from('personal_records').select('*').eq('department_id', profile.department_id).order('last_name', { ascending: true })
      : supabase.from('personal_records').select('*').order('last_name', { ascending: true })
  ])

  return (
    <PersonnelClient 
      initialRecords={(recordsResult.data as PersonalRecord[]) || []} 
      departments={(departmentsResult.data as Department[]) || []}
      userRole={profile?.role || 'regular_user'}
      userDeptId={profile?.department_id || null}
    />
  )
}

export default async function PersonalPage() {
  const supabase = await createClient()

  // Critical for privacy filtering
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, department_id').eq('id', user?.id).single()

  return (
    <div className="min-h-full bg-gray-50 pt-8">
      <Suspense fallback={<PersonnelSkeleton />}>
        <PersonnelDataLayer profile={profile as Pick<Profile, 'role' | 'department_id'> | null} />
      </Suspense>
    </div>
  )
}
