// =============================
// components/SuperAdmin/StatsCard.tsx
// =============================

import React from "react"
import { Crown, Shield, Scale, Users } from "lucide-react"

interface StatsCardProps {
  title: string
  count: number
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  borderColor: string
  selected: boolean
  onSelect: () => void
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  count,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  selected,
  onSelect
}) => (
  <button
    onClick={onSelect}
    className={`${bgColor} rounded-lg border p-4 w-full text-left hover:border-white/30 transition-all ${
      selected ? 'border-[#56ffbc]' : borderColor
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-xs font-medium">{title}</p>
        <p className="text-xl font-bold text-white mt-1">{count}</p>
      </div>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </button>
)