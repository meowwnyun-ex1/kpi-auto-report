import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { UnifiedError } from '@/components/ui/unified-error';
import { 
  KPICategory, 
  KPIMetric, 
  Department,
  getCategoryConfig,
  KPI_CATEGORY_CONFIGS 
} from '@/shared/types/kpi';
import { 
  Shield, 
  Award, 
  Truck, 
  FileCheck, 
  Users, 
  Star, 
  Leaf, 
  DollarSign,
  Save,
  X,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Star,
  Leaf,
  DollarSign,
};

interface DataEntryForm {
  metric_id: string;
  department_id: string;
  value: string;
  target_value: string;
  notes: string;
}

// Mock data generator
const generateMockMetrics = (category: KPICategory): KPIMetric[] => {
  const config = getCategoryConfig(category);
  return [
    {
      id: 1,
      category,
      name: `${config.name_th} Metric 1`,
      code: `${category.toUpperCase()}_001`,
      description: `Description for ${config.name_th} Metric 1`,
      unit: '%',
      metric_type: 'percentage',
      target_value: 100,
      warning_threshold: 80,
      critical_threshold: 60,
      calculation_method: 'average',
      is_active: true
    },
    {
      id: 2,
      category,
      name: `${config.name_th} Metric 2`,
      code: `${category.toUpperCase()}_002`,
      description: `Description for ${config.name_th} Metric 2`,
      unit: 'จำนวน',
      metric_type: 'count',
      target_value: 50,
      warning_threshold: 40,
      critical_threshold: 30,
      calculation_method: 'sum',
      is_active: true
    },
    {
      id: 3,
      category,
      name: `${config.name_th} Metric 3`,
      code: `${category.toUpperCase()}_003`,
      description: `Description for ${config.name_th} Metric 3`,
      unit: 'คะแนน',
      metric_type: 'score',
      target_value: 5,
      warning_threshold: 3,
      critical_threshold: 2,
      calculation_method: 'average',
      is_active: true
    }
  ];
};

const generateMockDepartments = (category: KPICategory): Department[] => {
  const config = getCategoryConfig(category);
  return config.departments.map((name, index) => ({
    id: index + 1,
    name,
    code: name.substring(0, 3).toUpperCase(),
    category,
    is_active: true
  }));
};

export const KPIDataEntry: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [periodDate, setPeriodDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  const [entries, setEntries] = useState<DataEntryForm[]>([
    { metric_id: '', department_id: '', value: '', target_value: '', notes: '' }
  ]);

  // Validate category
  const validCategory = KPI_CATEGORY_CONFIGS.find(c => c.key === category);
  const categoryConfig = validCategory ? getCategoryConfig(validCategory.key as KPICategory) : null;

  useEffect(() => {
    const fetchData = async () => {
      if (!validCategory) {
        setError('Invalid category');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API calls
        // const [metricsRes, deptsRes] = await Promise.all([
        //   fetch(`/api/kpi/${category}/metrics`),
        //   fetch(`/api/kpi/${category}/departments`)
        // ]);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockMetrics = generateMockMetrics(validCategory.key as KPICategory);
        const mockDepts = generateMockDepartments(validCategory.key as KPICategory);
        
        setMetrics(mockMetrics);
        setDepartments(mockDepts);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [validCategory]);

  const addEntry = () => {
    setEntries([
      ...entries,
      { metric_id: '', department_id: '', value: '', target_value: '', notes: '' }
    ]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof DataEntryForm, value: string) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    
    // Auto-fill target value when metric is selected
    if (field === 'metric_id') {
      const selectedMetric = metrics.find(m => m.id.toString() === value);
      if (selectedMetric) {
        newEntries[index].target_value = selectedMetric.target_value.toString();
      }
    }
    
    setEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate entries
    const invalidEntries = entries.filter(e => !e.metric_id || !e.value);
    if (invalidEntries.length > 0) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/kpi/${category}/entries`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     entries: entries.map(e => ({
      //       ...e,
      //       period,
      //       period_date: periodDate
      //     }))
      //   })
      // });

      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: 'บันทึกข้อมูลสำเร็จ',
        variant: 'success'
      });

      // Navigate back to dashboard
      navigate(`/${category}/dashboard`);
    } catch (err) {
      toast({
        title: 'ไม่สามารถบันทึกข้อมูลได้',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!validCategory) {
    return (
      <ShellLayout variant="user" showStats={false}>
        <UnifiedError 
          type="404" 
          title="Category Not Found"
          message={`KPI category "${category}" does not exist.`}
        />
      </ShellLayout>
    );
  }

  const IconComponent = iconMap[categoryConfig?.icon || 'Shield'];

  return (
    <ShellLayout variant="user" showStats={false}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-lg" 
              style={{ backgroundColor: `${categoryConfig?.color}20` }}
            >
              <IconComponent 
                className="h-6 w-6" 
                style={{ color: categoryConfig?.color }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                กรอกข้อมูล {categoryConfig?.name_th}
              </h1>
              <p className="text-sm text-gray-500">บันทึกผลการดำเนินงานตัวชี้วัด</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => navigate(`/${category}/dashboard`)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            ยกเลิก
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <UnifiedError 
            type="data-error"
            title="ไม่สามารถโหลดข้อมูลได้"
            message={error}
            showRetry
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Form */}
        {!loading && !error && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ช่วงเวลาของข้อมูล</CardTitle>
                <CardDescription>เลือกช่วงเวลาและวันที่ของข้อมูลที่จะบันทึก</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period">ช่วงเวลา</Label>
                    <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                      <SelectTrigger id="period">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">รายวัน</SelectItem>
                        <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                        <SelectItem value="monthly">รายเดือน</SelectItem>
                        <SelectItem value="quarterly">รายไตรมาส</SelectItem>
                        <SelectItem value="yearly">รายปี</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodDate">วันที่</Label>
                    <div className="relative">
                      <Input
                        id="periodDate"
                        type="date"
                        value={periodDate}
                        onChange={(e) => setPeriodDate(e.target.value)}
                        className="pr-10"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Entries */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">ข้อมูลตัวชี้วัด</CardTitle>
                    <CardDescription>กรอกผลการดำเนินงานตัวชี้วัด</CardDescription>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addEntry}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มรายการ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entries.map((entry, index) => (
                    <div 
                      key={index}
                      className="p-4 border rounded-lg bg-gray-50/50 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">รายการที่ {index + 1}</Badge>
                        {entries.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEntry(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Metric Selection */}
                        <div className="space-y-2">
                          <Label htmlFor={`metric-${index}`}>ตัวชี้วัด</Label>
                          <Select 
                            value={entry.metric_id} 
                            onValueChange={(v) => updateEntry(index, 'metric_id', v)}
                          >
                            <SelectTrigger id={`metric-${index}`}>
                              <SelectValue placeholder="เลือกตัวชี้วัด" />
                            </SelectTrigger>
                            <SelectContent>
                              {metrics.map(metric => (
                                <SelectItem key={metric.id} value={metric.id.toString()}>
                                  {metric.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Department Selection */}
                        <div className="space-y-2">
                          <Label htmlFor={`dept-${index}`}>แผนก</Label>
                          <Select 
                            value={entry.department_id} 
                            onValueChange={(v) => updateEntry(index, 'department_id', v)}
                          >
                            <SelectTrigger id={`dept-${index}`}>
                              <SelectValue placeholder="เลือกแผนก" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map(dept => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Value Input */}
                        <div className="space-y-2">
                          <Label htmlFor={`value-${index}`}>ค่าที่วัดได้</Label>
                          <Input
                            id={`value-${index}`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={entry.value}
                            onChange={(e) => updateEntry(index, 'value', e.target.value)}
                          />
                        </div>

                        {/* Target Value */}
                        <div className="space-y-2">
                          <Label htmlFor={`target-${index}`}>เป้าหมาย</Label>
                          <Input
                            id={`target-${index}`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={entry.target_value}
                            onChange={(e) => updateEntry(index, 'target_value', e.target.value)}
                            className="bg-gray-100"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor={`notes-${index}`}>หมายเหตุ (ถ้ามี)</Label>
                        <Textarea
                          id={`notes-${index}`}
                          placeholder="หมายเหตุหรือคำอธิบายเพิ่มเติม..."
                          value={entry.notes}
                          onChange={(e) => updateEntry(index, 'notes', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate(`/${category}/dashboard`)}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                disabled={saving}
                className="gap-2"
              >
                <Save className={`h-4 w-4 ${saving ? 'animate-pulse' : ''}`} />
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ShellLayout>
  );
};

export default KPIDataEntry;
