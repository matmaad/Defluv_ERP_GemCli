import React from 'react'

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0a2d4d] border-t-transparent"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a2d4d] animate-pulse">
          Cargando Módulo...
        </p>
      </div>
    </div>
  )
}
