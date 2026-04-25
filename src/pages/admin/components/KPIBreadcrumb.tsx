import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface KPIBreadcrumbProps {
  activeTab: string;
  activeCategory: string | null;
  activeSubcategory: string | null;
  categories: any[];
  subcategories: any[];
  onBackToCategories: () => void;
  onBackToSubcategories: () => void;
}

export function KPIBreadcrumb({
  activeTab,
  activeCategory,
  activeSubcategory,
  categories,
  subcategories,
  onBackToCategories,
  onBackToSubcategories,
}: KPIBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm mb-6">
      <Button
        variant={activeTab === 'overview' ? 'default' : 'ghost'}
        onClick={onBackToCategories}
        className="font-medium">
        Categories
      </Button>
      {activeCategory && (
        <>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Button
            variant={activeTab === 'subcategory' ? 'default' : 'ghost'}
            onClick={onBackToSubcategories}
            className="font-medium">
            {categories.find((c) => c.key === activeCategory)?.name || activeCategory}
          </Button>
        </>
      )}
      {activeSubcategory && (
        <>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-600">
            {subcategories.find((s) => s.key === activeSubcategory)?.name || activeSubcategory}
          </span>
        </>
      )}
    </div>
  );
}

export default KPIBreadcrumb;
