import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, TrendingDown, Minus, Award, AlertTriangle } from 'lucide-react';

interface DepartmentsTabProps {
  departmentData: { name: string; target: number; result: number; rate: number }[];
}

export function DepartmentsTab({ departmentData }: DepartmentsTabProps) {
  const getPerformanceIcon = (rate: number) => {
    if (rate >= 100) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rate >= 75) return <Minus className="w-4 h-4 text-blue-500" />;
    if (rate >= 50) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 100) return <Badge className="bg-green-100 text-green-700">Excellent</Badge>;
    if (rate >= 75) return <Badge className="bg-blue-100 text-blue-700">Good</Badge>;
    if (rate >= 50) return <Badge className="bg-amber-100 text-amber-700">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-700">Needs Work</Badge>;
  };

  const sortedData = [...departmentData].sort((a, b) => b.rate - a.rate);
  const topPerformer = sortedData[0];
  const avgRate =
    departmentData.length > 0
      ? departmentData.reduce((sum, dept) => sum + dept.rate, 0) / departmentData.length
      : 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Departments</p>
                <p className="text-2xl font-bold text-blue-900">{departmentData.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Average Performance</p>
                <p className="text-2xl font-bold text-green-900">{avgRate.toFixed(1)}%</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {topPerformer && (
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Top Performer</p>
                  <p className="text-lg font-bold text-purple-900">{topPerformer.name}</p>
                  <p className="text-sm text-purple-700">{topPerformer.rate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Department Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Department Performance Details
            </div>
            <div className="text-sm text-gray-500 font-normal">
              {departmentData.length} departments
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedData.map((dept, idx) => (
              <Card key={dept.name} className="hover:shadow-lg transition-all duration-200 group">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : idx === 1
                              ? 'bg-gray-100 text-gray-700'
                              : idx === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-600'
                        }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">
                          {dept.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          {getPerformanceIcon(dept.rate)}
                          <span className="text-xs text-gray-500">{dept.rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    {getPerformanceBadge(dept.rate)}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Target</div>
                      <div className="font-mono font-bold text-gray-700">
                        {dept.target.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Result</div>
                      <div className="font-mono font-bold text-green-600">
                        {dept.result.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Achievement Rate</span>
                      <span className="text-xs font-medium">{dept.rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(100, dept.rate)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
