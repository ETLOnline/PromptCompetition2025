// =============================
// components/SuperAdmin/Pagination.tsx
// =============================

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  totalPages: number
  currentPage: number
  onPageChange: (n: number) => void
  startIndex: number
  endIndex: number
  totalItems: number
}

export const Pagination: React.FC<PaginationProps> = ({ totalPages, currentPage, onPageChange, startIndex, endIndex, totalItems }) => {
  if (totalPages <= 1) return null
  const pages = []
  const count = Math.min(5, totalPages)
  for (let i = 0; i < count; i++) {
    let p = i + 1
    if (totalPages > 5) {
      if (currentPage > 3 && currentPage < totalPages - 2) {
        p = currentPage - 2 + i
      } else if (currentPage >= totalPages - 2) {
        p = totalPages - 4 + i
      }
    }
    pages.push(p)
  }
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
      <div className="text-xs text-gray-400">
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} users
      </div>
      <div className="flex items-center gap-2">
        <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="p-1 text-gray-400 hover:text-white disabled:opacity-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-2 py-1 text-xs rounded ${
                p === currentPage ? 'bg-[#56ffbc] text-[#07073a] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="p-1 text-gray-400 hover:text-white disabled:opacity-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}