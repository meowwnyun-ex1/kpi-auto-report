import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/shared/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  AlertTriangle,
  CheckCircle,
  Users,
  Shield,
  Award,
  Truck,
  Scale,
  Heart,
  Leaf,
  DollarSign,
  Building2,
  Calendar,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';

// KPI Categories Configuration
const KPI_CATEGORIES = [
  {
    id: 'safety',
    name: 'Safety',
    nameTh: 'Safety',
    description: 'Workplace Safety Performance',
    icon: Shield,
    color: '#DC2626',
  },
  {
    id: 'quality',
    name: 'Quality',
    nameTh: 'Quality',
    description: 'Product Quality Standards',
    icon: Award,
    color: '#16A34A',
  },
  {
    id: 'delivery',
    name: 'Delivery',
    nameTh: 'Delivery',
    description: 'On-time Delivery Performance',
    icon: Truck,
    color: '#2563EB',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    nameTh: 'Compliance',
    description: 'Regulatory Compliance Status',
    icon: Scale,
    color: '#9333EA',
  },
  {
    id: 'hr',
    name: 'HR',
    nameTh: 'HR',
    description: 'Human Resources Metrics',
    icon: Users,
    color: '#EA580C',
  },
  {
    id: 'attractive',
    name: 'Attractive',
    nameTh: 'Attractive',
    description: 'Workplace Attractiveness',
    icon: Heart,
    color: '#DB2777',
  },
  {
    id: 'environment',
    name: 'Environment',
    nameTh: 'Environment',
    description: 'Environmental Impact',
    icon: Leaf,
    color: '#0D9488',
  },
  {
    id: 'cost',
    name: 'Cost',
    nameTh: 'Cost',
    description: 'Cost Management',
    icon: DollarSign,
    color: '#4F46E5',
  },
];

function MainDashboard({ initialCategory }: { initialCategory?: string } = {}) {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDept, setSelectedDept] = useState('all');
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});

  // Available years for fiscal year selector
  const availableYears = [2025, 2026, 2027];

  // Calculate overall score from real data
  const overallScore = React.useMemo(() => {
    if (kpiData.length === 0) return 0;
    const totalTarget = kpiData.reduce((sum, item) => sum + (item.total_target || 0), 0);
    const totalUsed = kpiData.reduce((sum, item) => sum + (item.used_quota || 0), 0);
    return totalTarget > 0 ? (totalUsed / totalTarget) * 100 : 0;
  }, [kpiData]);

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const r = await fetch('/api/departments');
        const d = await r.json();
        if (d.success) {
          setDepartments(d.data);
        }
      } catch {
        /* silent */
      }
    };
    loadDepartments();
  }, []);

  // Load KPI data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load yearly targets
        const yearlyResponse = await fetch(
          `/api/kpi-forms/yearly/${selectedDept === 'all' ? 'all' : selectedDept}/${selectedYear}`,
          { headers: { Authorization: `Bearer ${storage.getAuthToken()}` } }
        );
        const yearlyData = await yearlyResponse.json();

        if (yearlyData.success) {
          setKpiData(yearlyData.data || []);
        }

        // Load stats
        const statsResponse = await fetch(
          `/api/kpi-forms/stats/${selectedDept === 'all' ? 'all' : selectedDept}/${selectedYear}`,
          { headers: { Authorization: `Bearer ${storage.getAuthToken()}` } }
        );
        const statsData = await statsResponse.json();

        if (statsData.success) {
          setStats(statsData.data || {});
        }

        // Load monthly data for current month
        const monthlyResponse = await fetch(
          `/api/kpi-forms/monthly/${selectedDept === 'all' ? 'all' : selectedDept}/${selectedYear}`,
          { headers: { Authorization: `Bearer ${storage.getAuthToken()}` } }
        );
        const monthlyResult = await monthlyResponse.json();

        if (monthlyResult.success) {
          // Filter for current month
          const currentMonthData = (monthlyResult.data || []).filter(
            (item: any) => item.month === selectedMonth
          );
          setMonthlyData(currentMonthData);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };

    if (selectedYear && selectedDept) {
      loadData();
    }
  }, [selectedYear, selectedDept, selectedMonth]);

  // Calculate category stats from real data
  const calculateCategoryStats = (categoryId: string) => {
    const categoryData = kpiData.filter((item) => {
      // Map category_id to category key
      const categoryMap: Record<number, string> = {
        1: 'safety',
        2: 'quality',
        3: 'delivery',
        4: 'compliance',
        5: 'hr',
        6: 'attractive',
        7: 'environment',
        8: 'cost',
      };
      return categoryMap[item.category_id] === categoryId;
    });

    const target = categoryData.reduce((sum, item) => sum + (item.total_target || 0), 0);
    const used = categoryData.reduce((sum, item) => sum + (item.used_quota || 0), 0);

    return {
      target,
      actual: used,
      count: categoryData.length,
      comments: [],
    };
  };

  const months = [
    { value: '4', label: 'Apr' },
    { value: '5', label: 'May' },
    { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' },
    { value: '8', label: 'Aug' },
    { value: '9', label: 'Sep' },
    { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Dec' },
    { value: '1', label: 'Jan' },
    { value: '2', label: 'Feb' },
    { value: '3', label: 'Mar' },
  ];

  return (
    <ShellLayout>
      <StandardPageLayout
        title="KPI Executive Dashboard"
        subtitle="Real-time KPI monitoring for management decisions"
        icon={Target}
        iconColor="text-blue-600"
        badge="Overview"
        department={selectedDept === 'all' ? '' : selectedDept}
        fiscalYear={selectedYear}
        availableYears={availableYears}
        onDepartmentChange={(value) => setSelectedDept(value === '' ? 'all' : value)}
        onFiscalYearChange={(value) => setSelectedYear(value)}
        onRefresh={() => {
          // Refresh data
        }}
        loading={loading}
        theme="blue"
        rightActions={
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[120px] h-8 bg-blue-50 border-blue-200 text-blue-700 text-xs font-medium">
              <CalendarDays className="w-3.5 h-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }>
        <div className="space-y-6">
          {/* Overall Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Overall Score */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <Target className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">Overall Score</h3>
                      <p className="text-xs text-gray-500">Based on {kpiData.length} KPIs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-blue-600">
                      {overallScore.toFixed(1)}%
                    </div>
                    <div className="text-xs text-blue-500 mt-0.5">Performance</div>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <Progress value={overallScore} className="h-2 bg-blue-100" />
              </div>
            </div>

            {/* Data Entries */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">Yearly Targets</h3>
                      <p className="text-xs text-gray-500">FY {selectedYear}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-600">{kpiData.length}</div>
                    <div className="text-xs text-emerald-500 mt-0.5">Recorded</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Updates */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <AlertTriangle className="w-3 h-3 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">Monthly Updates</h3>
                      <p className="text-xs text-gray-500">
                        {months.find((m) => m.value === selectedMonth.toString())?.label || 'Month'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-orange-600">{monthlyData.length}</div>
                    <div className="text-xs text-orange-500 mt-0.5">Entries</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <Users className="w-3 h-3 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">Departments</h3>
                      <p className="text-xs text-gray-500">
                        {selectedDept === 'all' ? 'All Departments' : selectedDept}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-purple-600">{departments.length}</div>
                    <div className="text-xs text-purple-500 mt-0.5">Teams</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Category Cards */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {KPI_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const stats = calculateCategoryStats(category.id);
                const achievement = stats.target > 0 ? (stats.actual / stats.target) * 100 : 0;
                const isGood = achievement >= 95;
                const isWarning = achievement >= 80 && achievement < 95;

                return (
                  <div
                    key={category.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
                    style={{ borderLeftColor: category.color, borderLeftWidth: 4 }}>
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm"
                            style={{ background: `${category.color}18` }}>
                            <Icon className="w-3 h-3" style={{ color: category.color }} />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-gray-900">{category.name}</h3>
                            <p className="text-xs text-gray-500">{category.nameTh}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black" style={{ color: category.color }}>
                            {achievement.toFixed(1)}%
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${
                              isGood
                                ? 'text-emerald-500'
                                : isWarning
                                  ? 'text-amber-500'
                                  : 'text-red-500'
                            }`}>
                            {isGood ? 'Excellent' : isWarning ? 'Good' : 'Needs Work'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-end text-xs">
                        <div>
                          <div className="text-gray-500">Target</div>
                          <div className="font-mono font-bold text-gray-700">
                            {stats.target.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-500">Actual</div>
                          <div className="font-mono font-bold text-gray-700">
                            {stats.actual.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress
                          value={Math.min(100, achievement)}
                          className="h-1.5"
                          style={{
                            backgroundColor: '#E5E7EB',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </StandardPageLayout>
    </ShellLayout>
  );
}

export default MainDashboard;
