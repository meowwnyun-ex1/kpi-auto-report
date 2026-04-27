import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, GanttChart } from 'lucide-react';
import { ActionPlan, MONTHS, STATUS_OPTIONS } from './ActionPlansTypes';

interface GanttChartViewProps {
  validPlans: ActionPlan[];
  getStatusColor: (status: string) => string;
  getProgressColor: (progress: number) => string;
}

export function GanttChartView({ validPlans, getStatusColor, getProgressColor }: GanttChartViewProps) {
  if (validPlans.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GanttChart className="h-5 w-5" />
          Gantt Chart View
        </CardTitle>
        <CardDescription>Visual timeline of action plans</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs mb-4">
          {STATUS_OPTIONS.map((s) => (
            <div key={s.value} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${s.color}`} />
              <span>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Gantt Chart */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Month Headers */}
            <div className="grid grid-cols-[1fr_repeat(12,50px)] gap-1 mb-2">
              <div className="font-medium text-xs p-2">Action Plan</div>
              {MONTHS.map((m) => (
                <div key={m.value} className="text-center text-xs font-medium p-2 border-b">
                  {m.label}
                </div>
              ))}
            </div>

            {/* Action Plan Rows */}
            {validPlans.map((plan, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_repeat(12,50px)] gap-1 border-b py-2">
                {/* Action Name */}
                <div className="p-2">
                  <div className="text-xs font-medium truncate" title={plan.key_action}>
                    {plan.key_action}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(plan.status)} text-white border-0`}>
                      {plan.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{plan.progress}%</span>
                  </div>
                </div>

                {/* Month Cells */}
                {Array.from({ length: 12 }, (_, monthIdx) => {
                  const month = monthIdx + 1;
                  const isActive = month >= plan.start_month && month <= plan.end_month;
                  const isCurrentMonth = month === new Date().getMonth() + 1;

                  return (
                    <div
                      key={month}
                      className={`h-8 border-l relative ${isCurrentMonth ? 'bg-blue-50' : ''}`}>
                      {isActive && (
                        <div
                          className={`absolute top-1 bottom-1 left-1 right-1 rounded ${
                            plan.status === 'Completed'
                              ? 'bg-green-200'
                              : plan.status === 'Delayed'
                                ? 'bg-red-200'
                                : month < new Date().getMonth() + 1
                                  ? `${getProgressColor(plan.progress)} opacity-60`
                                  : 'bg-gray-200'
                          }`}
                          title={`${plan.key_action}: ${MONTHS[plan.start_month - 1].label} - ${MONTHS[plan.end_month - 1].label}`}>
                          {month === plan.start_month && (
                            <div className="h-full flex items-center justify-center">
                              <ChevronRight className="h-3 w-3 text-gray-600" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
