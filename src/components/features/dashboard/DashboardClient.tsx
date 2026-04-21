'use client'

import React, { useState } from 'react'
import { 
  ShieldCheck, 
  FileCheck, 
  AlertTriangle, 
  Bell,
  Settings,
  Info,
  X,
  Plus
} from 'lucide-react'
import { Task, KPI, Deadline } from '@/app/types/database'
import CreateTaskModal from './CreateTaskModal'

interface Props {
  kpis: KPI[]
  tasks: Task[]
  deadlines: Deadline[]
  userName: string
  userRole: string
  departments: { id: string; name: string }[]
  users: { id: string; first_name: string; last_name: string; department_id: string | null }[]
}

const metricConfig: Record<string, any> = {
...
      <CreateTaskModal 
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        departments={departments}
        users={users}
      />
    </div>
  )
}
...
