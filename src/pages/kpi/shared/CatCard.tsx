import React from 'react';
import { Target, ChevronLeft } from 'lucide-react';
import {
  getCategoryPriorityColor,
  KPI_CATEGORY_PRIORITIES,
  getPriorityClasses,
} from '@/constants/priority-colors';
import { PriorityValue, PriorityText } from '@/components/ui/priority-text';

// Types
interface Category {
  id: number;
  name: string;
  key: string;
}

interface CatCardProps {
  c: Category;
  categoryTargetValues: Record<string, number>;
  categoryTargetCounts: Record<string, number>;
  statsLoading: boolean;
  onClick: () => void;
  catColor: string;
}

const CAT: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  safety: { color: '#DC2626', icon: Target },
  quality: { color: '#16A34A', icon: Target },
  delivery: { color: '#2563EB', icon: Target },
  compliance: { color: '#9333EA', icon: Target },
  hr: { color: '#EA580C', icon: Target },
  attractive: { color: '#DB2777', icon: Target },
  environment: { color: '#0D9488', icon: Target },
  cost: { color: '#4F46E5', icon: Target },
};

export function CatCard({
  c,
  categoryTargetValues,
  categoryTargetCounts,
  statsLoading,
  onClick,
  catColor,
}: CatCardProps) {
  const cfg = CAT[c.key] ?? { color: catColor || '#6B7280', icon: Target };
  const Icon = cfg.icon;
  const targetValue = categoryTargetValues[c.key] || 0;
  const targetCount = categoryTargetCounts[c.key] || 0;
  const totalTargetValue = Object.values(categoryTargetValues).reduce((sum, val) => sum + val, 0);
  const totalTargetCount = Object.values(categoryTargetCounts).reduce((sum, val) => sum + val, 0);

  // Calculate percentage based on target count (number of items)
  const targetPercentage = totalTargetCount > 0 ? (targetCount / totalTargetCount) * 100 : 0;

  // Get priority-based colors
  const priorityLevel = KPI_CATEGORY_PRIORITIES[c.key] || 'neutral';
  const priorityColors = getCategoryPriorityColor(c.key);
  const priorityClasses = getPriorityClasses(priorityLevel);
  const hasData = targetCount > 0;

  return (
    <button
      key={c.id}
      onClick={onClick}
      className={`group relative flex flex-col p-5 bg-white rounded-2xl border hover:shadow-md transition-all text-left focus:outline-none ${priorityClasses.card} ${priorityClasses.cardHover}`}
      style={{ borderLeftColor: priorityColors.primary, borderLeftWidth: 4 }}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${priorityColors.primary}18` }}>
        <span style={{ color: priorityColors.primary }}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-800">{c.name}</p>
      <div className="mt-3 flex items-end gap-1.5">
        <PriorityValue
          value={targetPercentage}
          suffix="%"
          decimals={1}
          priority={hasData ? 'high' : 'muted'}
          size="3xl"
          weight="bold"
          className="leading-none"
        />
        <span className="text-xs text-gray-400 mb-0.5">of total</span>
      </div>
      <div className="mt-1">
        <PriorityValue
          value={targetCount}
          suffix=" Targets"
          priority={hasData ? 'medium' : 'muted'}
          size="xs"
          weight="medium"
        />
      </div>
      <div
        className={`absolute right-3 bottom-3 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${hasData ? priorityClasses.bg : 'bg-gray-100'} ${hasData ? 'group-hover:bg-opacity-80' : 'group-hover:bg-gray-200'}`}>
        <ChevronLeft
          className={`w-3 h-3 rotate-180 ${hasData ? priorityClasses.text : 'text-gray-500'}`}
        />
      </div>
      {statsLoading && <div className="absolute inset-0 bg-white/40 rounded-2xl" />}
    </button>
  );
}
