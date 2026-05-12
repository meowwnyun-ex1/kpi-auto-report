import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/components/layout';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
  Shield,
  Award,
  Truck,
  Leaf,
  Star,
  FileCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { KPI_CATEGORIES, MONTHS } from '../constants';
import { useFiscalYearSelector } from '@/contexts/FiscalYearContext';
import { storage } from '@/shared/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCategoryTheme } from '@/shared/utils/category-theme';
import { ApiService } from '@/services/api-service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableContainer } from '@/shared/components/TableContainer';

interface FY25SummaryData {
  category: string;
  name: string;
  totalTargets: number;
  totalResults: number;
  achievedCount: number;
  notAchievedCount: number;
  pendingCount: number;
  achievementRate: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  monthlyData: {
    [month: number]: {
      target: number;
      result: number;
      achievement: number;
    };
  };
}

export default function FY25SummaryPage() {
  const navigate = useNavigate();
  const { fiscalYear, setFiscalYear, availableYears } = useFiscalYearSelector();
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<FY25SummaryData[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadFY25Summary();
  }, [fiscalYear, selectedDepartment, selectedCategory]);

  const loadFY25Summary = async () => {
    try {
      setLoading(true);
      
      // Load FY25 summary data
      const summaryRes = await ApiService.get<any>(`/stats/fy25-summary/${fiscalYear}`, {
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });

      if (summaryRes.success) {
        const data = summaryRes.data || {};
        const summaryArray: FY25SummaryData[] = [];

        // Process each category's data
        Object.entries(data).forEach(([categoryKey, categoryData]: [string, any]) => {
          const config = KPI_CATEGORIES.find((c) => c.id === categoryKey);
          const totalTargets = categoryData.total_targets || 0;
          const totalResults = categoryData.total_results || 0;
          const achievedCount = categoryData.achieved_count || 0;
          const notAchievedCount = categoryData.not_achieved_count || 0;
          const pendingCount = totalTargets - totalResults;
          const achievementRate = totalTargets > 0 ? (totalResults / totalTargets) * 100 : 0;

          // Calculate trend (simplified - would need historical data for real trend)
          const trend: 'up' | 'down' | 'stable' = achievementRate >= 95 ? 'up' : achievementRate >= 85 ? 'stable' : 'down';

          summaryArray.push({
            category: categoryKey,
            name: config?.name || categoryKey,
            totalTargets,
            totalResults,
            achievedCount,
            notAchievedCount,
            pendingCount,
            achievementRate,
            trend,
            icon: config?.icon || BarChart3,
            color: config?.color || '#6B7280',
            monthlyData: categoryData.monthly_data || {},
          });
        });

        setSummaryData(summaryArray);
      } else {
        console.error('Failed to load FY25 summary data');
        setSummaryData([]);
      }
    } catch (error) {
      console.error('Error loading FY25 summary:', error);
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    let filtered = summaryData;

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(item => {
        // Would need department mapping to filter properly
        return true; // For now, show all data
      });
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    return filtered;
  }, [summaryData, selectedDepartment, selectedCategory]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        totalTargets: acc.totalTargets + item.totalTargets,
        totalResults: acc.totalResults + item.totalResults,
        achievedCount: acc.achievedCount + item.achievedCount,
        notAchievedCount: acc.notAchievedCount + item.notAchievedCount,
        pendingCount: acc.pendingCount + item.pendingCount,
      }),
      {
        totalTargets: 0,
        totalResults: 0,
        achievedCount: 0,
        notAchievedCount: 0,
        pendingCount: 0,
      }
    );
  }, [filteredData]);

  const overallAchievementRate = overallStats.totalTargets > 0 
    ? (overallStats.totalResults / overallStats.totalTargets) * 100 
    : 0;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-yellow-400 rounded-full" />;
    }
  };

  const getAchievementColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 75) return 'text-blue-600 bg-blue-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <ShellLayout variant="user">
      <StandardPageLayout
        title="FY25 KPI Summary Dashboard"
        icon={BarChart3}
        iconColor="text-blue-600"
        onRefresh={loadFY25Summary}
        loading={loading}
        theme="blue">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fiscal Year</label>
            <Select value={fiscalYear.toString()} onValueChange={(value) => setFiscalYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Fiscal Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    FY{year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="SE">SE</SelectItem>
                <SelectItem value="PD">PD</SelectItem>
                <SelectItem value="PC">PC</SelectItem>
                <SelectItem value="PE">PE</SelectItem>
                <SelectItem value="QC">QC</SelectItem>
                <SelectItem value="QA">QA</SelectItem>
                <SelectItem value="PU">PU</SelectItem>
                <SelectItem value="WH">WH</SelectItem>
                <SelectItem value="MT">MT</SelectItem>
                <SelectItem value="GA">GA</SelectItem>
                <SelectItem value="CSR">CSR</SelectItem>
                <SelectItem value="ACC">ACC</SelectItem>
                <SelectItem value="AR">AR</SelectItem>
                <SelectItem value="AS">AS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {KPI_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600">Total Targets</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {overallStats.totalTargets}
                  </p>
                </div>
                <Target className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600">Achieved</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {overallStats.achievedCount}
                  </p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-600">Not Achieved</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {overallStats.notAchievedCount}
                  </p>
                </div>
                <XCircle className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600">Pending</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {overallStats.pendingCount}
                  </p>
                </div>
                <Clock className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Overall Performance</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Achievement rate across all categories
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-3xl font-bold ${getAchievementColor(overallAchievementRate).split(' ')[0]}`}
                  >
                    {overallAchievementRate}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {overallStats.totalResults} / {overallStats.totalTargets} Targets
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <TableContainer
          icon={BarChart3}
          title="FY25 KPI Summary by Category"
          totalCount={filteredData.length}
          countUnit="category"
          theme="blue"
          loading={loading}
          loadingRows={8}>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 sticky top-0 z-10">
                <TableRow className="border-b border-gray-300">
                  <TableHead className="text-left py-3 bg-blue-50">Category</TableHead>
                  <TableHead className="text-center py-3 bg-blue-50">Total Targets</TableHead>
                  <TableHead className="text-center py-3 bg-blue-50">Achieved</TableHead>
                  <TableHead className="text-center py-3 bg-blue-50">Not Achieved</TableHead>
                  <TableHead className="text-center py-3 bg-blue-50">Pending</TableHead>
                  <TableHead className="text-center py-3 bg-blue-50">Achievement Rate</TableHead>
                  <TableHead className="text-center py-3 bg-blue-50">Trend</TableHead>
                  <TableHead className="text-center py-3 bg-blue-50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => {
                  const Icon = item.icon as React.ComponentType<{ className?: string }>;
                  return (
                    <TableRow
                      key={item.category}
                      className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
                    >
                      <TableCell className="font-medium py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${item.color}20` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: item.color }} />
                          </div>
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center py-3 font-mono">
                        {item.totalTargets}
                      </TableCell>
                      
                      <TableCell className="text-center py-3">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {item.achievedCount}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-center py-3">
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          {item.notAchievedCount}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-center py-3">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          {item.pendingCount}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-center py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-lg font-bold ${getAchievementColor(item.achievementRate).split(' ')[0]}`}
                          >
                            {item.achievementRate.toFixed(1)}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.achievementRate}%`,
                                backgroundColor:
                                  item.achievementRate >= 90
                                    ? '#16A34A'
                                    : item.achievementRate >= 75
                                      ? '#2563EB'
                                      : item.achievementRate >= 60
                                        ? '#F59E0B'
                                        : '#DC2626',
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center py-3">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(item.trend)}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/category/${item.category}`)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/monthly/${item.category}`)}
                            className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
                          >
                            Monthly View
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TableContainer>
      </StandardPageLayout>
    </ShellLayout>
  );
}
