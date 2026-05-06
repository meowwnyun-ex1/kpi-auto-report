import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DepartmentBreakdownCardsProps {
  deptBreakdown: Array<{
    name: string;
    target: number;
    result: number;
    passed: number;
    failed: number;
    pending: number;
    count: number;
    rate: number;
    fillRate: number;
  }>;
  catColor: string;
}

export function DepartmentBreakdownCards({
  deptBreakdown,
  catColor,
}: DepartmentBreakdownCardsProps) {
  const getTrendIcon = (rate: number) => {
    if (rate >= 95) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rate >= 75) return <Minus className="w-4 h-4 text-amber-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5" style={{ color: catColor }} />
          <h3 className="font-semibold text-gray-900">Department Breakdown</h3>
          <Badge variant="outline" className="text-xs ml-2">
            {deptBreakdown.length} departments
          </Badge>
        </div>
        {deptBreakdown.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No department data for this period</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {deptBreakdown.map((dept, idx) => (
              <div
                key={dept.name}
                className="rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all group"
                style={{ borderLeftWidth: 3, borderLeftColor: catColor }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : idx === 1
                            ? 'bg-gray-100 text-gray-700'
                            : idx === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-50 text-gray-500'
                      }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {dept.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(dept.rate)}
                        <span className="text-xs text-gray-500">{dept.rate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`text-xs ${
                      dept.rate >= 95
                        ? 'bg-emerald-100 text-emerald-700'
                        : dept.rate >= 75
                          ? 'bg-blue-100 text-blue-700'
                          : dept.rate >= 50
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                    }`}>
                    {dept.rate >= 95
                      ? 'Excellent'
                      : dept.rate >= 75
                        ? 'Good'
                        : dept.rate >= 50
                          ? 'Fair'
                          : 'Needs Work'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-gray-500">Target</div>
                    <div className="font-mono font-bold text-gray-700">
                      {dept.target.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-gray-500">Result</div>
                    <div className="font-mono font-bold text-green-600">
                      {dept.result.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-gray-500">Filled</div>
                    <div className="font-mono font-bold text-blue-600">
                      {dept.fillRate.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <Progress
                  value={Math.min(100, dept.rate)}
                  className="h-2"
                  style={
                    {
                      '--progress-background': catColor,
                      backgroundColor: '#E5E7EB',
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
