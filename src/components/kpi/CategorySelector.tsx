import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { Category, CATEGORY_CONFIG } from '@/pages/kpi/actionplans/ActionPlansTypes';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onSelect: (key: string) => void;
}

export function CategorySelector({
  categories,
  selectedCategory,
  onSelect,
}: CategorySelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
            1
          </span>
          Select KPI Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {categories.map((cat) => {
            const config = CATEGORY_CONFIG[cat.key] || { color: '#6B7280', icon: Shield };
            const Icon = config.icon;
            const isSelected = selectedCategory === cat.key;

            return (
              <Button
                key={cat.id}
                variant={isSelected ? 'default' : 'outline'}
                className={`h-auto py-3 flex flex-col items-center gap-1 ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
                style={isSelected ? { backgroundColor: config.color } : {}}
                onClick={() => onSelect(cat.key)}>
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{cat.name}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
