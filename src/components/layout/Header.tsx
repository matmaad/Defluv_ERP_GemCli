// src/components/layout/Header.tsx
import { Bell, Settings, User } from 'lucide-react'

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h2 className="text-2xl font-bold text-[#0a2d4d]">{title}</h2>
        <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-[#0a2d4d] transition-colors">
          <Bell size={20} />
        </button>
        <button className="text-gray-400 hover:text-[#0a2d4d] transition-colors">
          <Settings size={20} />
        </button>
        
        <div className="flex items-center gap-3 border-l pl-6">
          <div className="text-right">
            <p className="text-sm font-bold text-[#0a2d4d] uppercase">Felipe Oyaneder</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <div className="h-10 w-10 bg-[#0a2d4d] rounded-md flex items-center justify-center text-white">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  )
}