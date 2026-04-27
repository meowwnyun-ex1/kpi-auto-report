import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/shared/hooks/use-toast';
import { useFiscalYearSelector } from '@/shared/hooks/useFiscalYearSelector';
import { storage } from '@/shared/utils';

interface AddTargetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number;
  categoryName: string;
  onSuccess: () => void;
}

// Enhanced KPI Data Structure with better relationships
const KPI_DATA = {
  safety: {
    name: 'Safety',
    subcategories: {
      worksite: {
        name: 'Worksite',
        measurements: [
          {
            id: 1,
            measurement: '1-Grade accident',
            unit: 'Case',
            main: 'SE',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 2,
            measurement: 'Reoccurrence',
            unit: 'Case',
            main: 'SE',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 3,
            measurement: 'Nearm',
            unit: 'Case',
            main: 'SE',
            description: '(Reduce 50% from FY24)',
            defaultTarget: 4,
          },
          {
            id: 4,
            measurement: '8-High risk audit',
            unit: 'Case',
            main: 'SE',
            description: '(Reduce 50% from FY24)',
            defaultTarget: 4,
          },
        ],
        relatedDepts: ['SE', 'PD', 'PC', 'PE', 'QC', 'QA', 'PU', 'WH', 'MT', 'GA'],
      },
      traffic: {
        name: 'Traffic',
        measurements: [
          {
            id: 5,
            measurement: 'Fatal',
            unit: 'Case',
            main: 'GA',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 6,
            measurement: 'Injury',
            unit: 'Case',
            main: 'GA',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 7,
            measurement: 'Illegal & dangerous driving',
            unit: 'Case',
            main: 'GA',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 8,
            measurement: 'Hit',
            unit: 'Case',
            main: 'GA',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 9,
            measurement: 'Been-hit & Other',
            unit: 'Case',
            main: 'GA',
            description: '',
            defaultTarget: 0,
          },
        ],
        relatedDepts: ['GA', 'All'],
      },
    },
  },
  quality: {
    name: 'Quality',
    subcategories: {
      claim: {
        name: 'Claim',
        measurements: [
          {
            id: 10,
            measurement: 'Critical claim',
            unit: 'Case',
            main: 'QA',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 11,
            measurement: '0-km claim (Official)',
            unit: 'Case',
            main: 'QA',
            description: '',
            defaultTarget: 4,
          },
          {
            id: 12,
            measurement: '0-km claim (All DN response)',
            unit: 'Case',
            main: 'QA',
            description: '',
            defaultTarget: 9,
          },
          {
            id: 13,
            measurement: 'OGC claim',
            unit: 'Case',
            main: 'QA',
            description: '',
            defaultTarget: 6,
          },
          {
            id: 14,
            measurement: 'Supplier NCR',
            unit: 'Case',
            main: 'QC',
            description: '',
            defaultTarget: 6,
          },
          {
            id: 15,
            measurement: 'Internal NCR',
            unit: 'Case',
            main: 'QC',
            description: '',
            defaultTarget: 5,
          },
        ],
        relatedDepts: ['QA', 'PD', 'PE', 'QC', 'PU'],
      },
      loss: {
        name: 'Loss',
        measurements: [
          {
            id: 16,
            measurement: 'Cost of spoilage',
            unit: '%',
            main: 'PD',
            description: '',
            defaultTarget: 0.56,
          },
          {
            id: 17,
            measurement: 'Cost of spoilage',
            unit: 'MB',
            main: 'PD',
            description: '',
            defaultTarget: 162.9,
          },
          {
            id: 18,
            measurement: 'Quality loss',
            unit: 'MB',
            main: 'AC',
            description: '',
            defaultTarget: 231.814,
          },
        ],
        relatedDepts: ['PD', 'PC', 'PE', 'QC', 'QA'],
      },
    },
  },
  delivery: {
    name: 'Delivery',
    subcategories: {
      long_bm: {
        name: 'Long BM >3 hr',
        measurements: [
          {
            id: 19,
            measurement: 'Priority shipment line > 3hr',
            unit: 'Case',
            main: 'MT',
            description: '<130 Case',
            defaultTarget: 130,
          },
        ],
        relatedDepts: ['MT', 'PD', 'PE'],
      },
      unplanned: {
        name: 'Unplanned holiday working',
        measurements: [
          {
            id: 20,
            measurement: 'OT unplanned recovery from m/c BM',
            unit: 'Day',
            main: 'MT',
            description: '',
            defaultTarget: 0,
          },
        ],
        relatedDepts: ['MT', 'PE', 'PC'],
      },
      on_plan: {
        name: 'On plan delivery',
        measurements: [
          { id: 21, measurement: '-', unit: '%', main: 'WH', description: '', defaultTarget: 100 },
        ],
        relatedDepts: ['WH', 'PD', 'PC'],
      },
      nearmiss: {
        name: 'Nearmiss delivery delay > 30 mins',
        measurements: [
          { id: 22, measurement: '-', unit: 'Case', main: 'WH', description: '', defaultTarget: 0 },
        ],
        relatedDepts: ['WH', 'PD', 'PC'],
      },
      freight: {
        name: 'Premium/Unplanned freight',
        measurements: [
          {
            id: 23,
            measurement: '-',
            unit: 'MB',
            main: 'PC',
            description: '"7.65/year 0.64/month"',
            defaultTarget: 7.65,
          },
        ],
        relatedDepts: ['PC', 'PD'],
      },
    },
  },
  compliance: {
    name: 'Compliance',
    subcategories: {
      business: {
        name: 'Business compliance',
        measurements: [
          {
            id: 24,
            measurement: 'Accident',
            unit: 'Case',
            main: 'AR',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 25,
            measurement: 'Nearmiss',
            unit: 'Case',
            main: 'AR',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 26,
            measurement: 'Incident',
            unit: 'Case',
            main: 'AR',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 27,
            measurement: 'Urgent purchasing',
            unit: 'Case',
            main: 'PU',
            description: '<280',
            defaultTarget: 280,
          },
          {
            id: 28,
            measurement: 'Urgent purchasing',
            unit: 'MB',
            main: 'PU',
            description: '<106',
            defaultTarget: 106,
          },
          {
            id: 29,
            measurement: 'Urgent purchasing clear within3 Month',
            unit: 'Case',
            main: 'PU',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 30,
            measurement: 'Urgent purchasing clear within3 Month',
            unit: 'MB',
            main: 'PU',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 31,
            measurement: 'Special purchasing',
            unit: 'Case',
            main: 'PU',
            description: '<192',
            defaultTarget: 192,
          },
          {
            id: 32,
            measurement: 'Special purchasing',
            unit: 'MB',
            main: 'PU',
            description: '<307',
            defaultTarget: 307,
          },
        ],
        relatedDepts: ['AR', 'PU', 'PD', 'PE', 'PC', 'QC', 'QA', 'All'],
      },
      info_security: {
        name: 'Information security',
        measurements: [
          {
            id: 33,
            measurement: 'Critical/Incident',
            unit: 'Case',
            main: 'GA&CSR',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 34,
            measurement: 'Lead to incident',
            unit: 'Case',
            main: 'GA&CSR',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 35,
            measurement: 'Nearmiss',
            unit: 'Case',
            main: 'GA&CSR',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 36,
            measurement: 'E-mail traing result',
            unit: 'Case',
            main: 'GA&CSR',
            description: '',
            defaultTarget: 5,
          },
        ],
        relatedDepts: ['GA', 'CSR', 'All'],
      },
      human: {
        name: 'Human compliance',
        measurements: [
          {
            id: 37,
            measurement: 'Accident',
            unit: 'Case',
            main: 'AR&AS',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 38,
            measurement: 'Nearmiss',
            unit: 'Case',
            main: 'AR&AS',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 39,
            measurement: 'Incident',
            unit: 'Case',
            main: 'AR&AS',
            description: '',
            defaultTarget: 0,
          },
        ],
        relatedDepts: ['AR', 'AS', 'All'],
      },
    },
  },
  hr: {
    name: 'HR',
    subcategories: {
      voice: {
        name: 'Voice of employee (Bad News First)',
        measurements: [
          { id: 44, measurement: '-', unit: 'Case', main: 'AR', description: '', defaultTarget: 0 },
        ],
        relatedDepts: ['AR', 'All'],
      },
      training: {
        name: 'Annual compulsory training',
        measurements: [
          {
            id: 45,
            measurement: 'HR training',
            unit: 'Curriculum/%',
            main: 'HRD',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 46,
            measurement: 'Dept. Training',
            unit: 'Persons/%',
            main: 'HRD',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 47,
            measurement: 'Mgmt. Training',
            unit: '%',
            main: 'HRD',
            description: '',
            defaultTarget: 100,
          },
          {
            id: 48,
            measurement: 'Pre boarding promotion',
            unit: 'Case',
            main: 'HRD',
            description: '',
            defaultTarget: 0,
          },
          {
            id: 49,
            measurement: 'Post boarding promotion',
            unit: 'Case',
            main: 'HRD',
            description: '',
            defaultTarget: 0,
          },
        ],
        relatedDepts: ['HRD', 'All'],
      },
      engagement: {
        name: 'Engagement',
        measurements: [
          { id: 50, measurement: '-', unit: 'Case', main: 'PD', description: '', defaultTarget: 0 },
          {
            id: 51,
            measurement: '-',
            unit: 'Case',
            main: 'AR',
            description: '3.20 points',
            defaultTarget: 3.2,
          },
        ],
        relatedDepts: ['PD', 'AR', 'All'],
      },
    },
  },
  attractive: {
    name: 'Attractive',
    subcategories: {
      non_value: {
        name: 'Non-value work reduction (Direct/Ind)',
        measurements: [
          {
            id: 52,
            measurement: 'Direct',
            unit: 'Case',
            main: 'PE',
            description: 'Direct 33%',
            defaultTarget: 33,
          },
          {
            id: 53,
            measurement: 'Indirect',
            unit: 'Case',
            main: 'PE',
            description: 'Indirect 10%',
            defaultTarget: 10,
          },
        ],
        relatedDepts: ['PE', 'All'],
      },
      projects: {
        name: 'Projects with Universities',
        measurements: [
          {
            id: 54,
            measurement: '-',
            unit: 'Case',
            main: 'INN',
            description: '70 Project',
            defaultTarget: 70,
          },
        ],
        relatedDepts: ['INN'],
      },
    },
  },
  environment: {
    name: 'Environment',
    subcategories: {
      energy: {
        name: 'Energy',
        measurements: [
          {
            id: 55,
            measurement: 'CO2 emission',
            unit: 'ton',
            main: 'MT',
            description: '<40,244',
            defaultTarget: 40244,
          },
          {
            id: 56,
            measurement: 'CO2 basic unit',
            unit: 'ton/VAP-MB',
            main: 'MT',
            description: '',
            defaultTarget: -2,
          },
          {
            id: 57,
            measurement: 'Energy saving',
            unit: '%',
            main: 'MT',
            description: '',
            defaultTarget: -7,
          },
          {
            id: 58,
            measurement: 'Energy saving',
            unit: 'ton',
            main: 'MT',
            description: '',
            defaultTarget: -3020,
          },
          {
            id: 59,
            measurement: 'Energy saving day',
            unit: 'Day',
            main: 'MT',
            description: '',
            defaultTarget: 39,
          },
          {
            id: 60,
            measurement: 'Energy cost (Electricity + Natural gas +N2)',
            unit: 'MB',
            main: 'MT',
            description: '<251.99',
            defaultTarget: 251.99,
          },
        ],
        relatedDepts: ['MT', 'PD', 'PE', 'SE', 'All'],
      },
      water: {
        name: 'Water',
        measurements: [
          {
            id: 61,
            measurement: 'Water usage',
            unit: 'm3',
            main: 'MT',
            description: '<292,915',
            defaultTarget: 292915,
          },
          {
            id: 62,
            measurement: 'Water reduciton',
            unit: 'm3/VAP-MB',
            main: 'MT',
            description: '',
            defaultTarget: -1,
          },
          {
            id: 63,
            measurement: 'Water cost (Water treatment + Wastewater)',
            unit: 'MB',
            main: 'MT',
            description: '<8.84',
            defaultTarget: 8.84,
          },
        ],
        relatedDepts: ['MT', 'PD', 'PE', 'GA', 'SE', 'All'],
      },
      waste: {
        name: 'Waste',
        measurements: [
          {
            id: 64,
            measurement: 'Waste reduction (Ton/VAP-MB)',
            unit: 'Ton/VAP-MB',
            main: 'SE',
            description: '"-1% FY24 (0.1920 Ton/VAP-)"',
            defaultTarget: 0.192,
          },
          {
            id: 65,
            measurement: 'Waste reduction (Ton)',
            unit: 'Ton',
            main: 'SE',
            description: '"< 3,298 Tons (As sale forcast 17,182.)"',
            defaultTarget: 17182,
          },
        ],
        relatedDepts: ['SE', 'PD', 'PE', 'All'],
      },
    },
  },
  cost: {
    name: 'Cost',
    subcategories: {
      sale: {
        name: 'Sale',
        measurements: [
          {
            id: 66,
            measurement: 'Sale',
            unit: 'MB',
            main: 'ACC',
            description: '',
            defaultTarget: 31107.79,
          },
        ],
        relatedDepts: ['ACC'],
      },
      profit: {
        name: 'Profit',
        measurements: [
          {
            id: 67,
            measurement: 'Amount',
            unit: 'MB',
            main: 'ACC',
            description: 'All Expense (KB),Investment (KB) Manpower (Prs)',
            defaultTarget: 3713.11,
          },
          {
            id: 68,
            measurement: 'Ratio',
            unit: '%',
            main: 'ACC',
            description: '',
            defaultTarget: 11.9,
          },
        ],
        relatedDepts: ['ACC', 'All'],
      },
      bep: {
        name: 'BEP',
        measurements: [
          {
            id: 69,
            measurement: '-',
            unit: '%',
            main: 'ACC',
            description: '',
            defaultTarget: 45.45,
          },
        ],
        relatedDepts: ['ACC'],
      },
      fixed_cost: {
        name: 'Fixed cost C/D',
        measurements: [
          {
            id: 70,
            measurement: '-',
            unit: '%',
            main: 'Acc',
            description: '',
            defaultTarget: 9.95,
          },
        ],
        relatedDepts: ['ACC'],
      },
      productivity: {
        name: 'Productivity',
        measurements: [
          {
            id: 71,
            measurement: 'Direct (%)',
            unit: '%',
            main: 'ACC',
            description: '"All (IOT, DX, Attractive etc.)"',
            defaultTarget: 100,
          },
          {
            id: 72,
            measurement: 'Direct (Ninku)',
            unit: 'Ninku',
            main: 'ACC',
            description: '"All (IOT, DX, Attractive etc.)"',
            defaultTarget: 1200,
          },
          {
            id: 73,
            measurement: 'Indirect (%)',
            unit: '%',
            main: 'ACC',
            description: '"All (IOT, DX, Attractive etc.)"',
            defaultTarget: 100,
          },
          {
            id: 74,
            measurement: 'Indirect (Ninku)',
            unit: 'Ninku',
            main: 'ACC',
            description: '"All (IOT, DX, Attractive etc.)"',
            defaultTarget: 1200,
          },
        ],
        relatedDepts: ['ACC', 'PD', 'PE', 'QC', 'All'],
      },
      labour: {
        name: 'Labour cost',
        measurements: [
          {
            id: 75,
            measurement: 'Direct',
            unit: 'MB',
            main: 'ACC',
            description: 'All',
            defaultTarget: 1174,
          },
          {
            id: 76,
            measurement: 'Indirect',
            unit: 'MB',
            main: 'ACC',
            description: 'All',
            defaultTarget: 962,
          },
        ],
        relatedDepts: ['ACC', 'All'],
      },
    },
  },
};

// Unit definitions with calculation types
const UNIT_DEFINITIONS = {
  Case: { type: 'count', description: 'Number of cases/incidents' },
  '%': { type: 'percentage', description: 'Percentage value' },
  MB: { type: 'currency', description: 'Million Baht' },
  Day: { type: 'time', description: 'Number of days' },
  'Curriculum/%': { type: 'mixed', description: 'Curriculum percentage' },
  'Persons/%': { type: 'mixed', description: 'Persons percentage' },
  ton: { type: 'weight', description: 'Tons' },
  m3: { type: 'volume', description: 'Cubic meters' },
  'Ton/VAP-MB': { type: 'ratio', description: 'Tons per VAP-MB' },
  'ton/VAP-MB': { type: 'ratio', description: 'Tons per VAP-MB' },
  Ninku: { type: 'productivity', description: 'Productivity ratio' },
  Score: { type: 'score', description: 'Score points' },
};

// Department mapping
const DEPARTMENTS = [
  { code: 'PD', name: 'Production' },
  { code: 'PE', name: 'Production Engineering' },
  { code: 'PC', name: 'Production Control' },
  { code: 'QC', name: 'Quality Control' },
  { code: 'QA', name: 'Quality Assurance' },
  { code: 'PU', name: 'Purchasing' },
  { code: 'WH', name: 'Warehouse' },
  { code: 'MT', name: 'Maintenance' },
  { code: 'SE', name: 'Safety' },
  { code: 'GA', name: 'General Affairs' },
  { code: 'AR', name: 'Asset & Risk' },
  { code: 'AS', name: 'Asset' },
  { code: 'ACC', name: 'Accounting' },
  { code: 'HRD', name: 'HR Development' },
  { code: 'INN', name: 'Innovation' },
  { code: 'CSR', name: 'CSR' },
  { code: 'AC', name: 'Administration' },
  { code: 'All', name: 'All Departments' },
];

export function AddTargetModal({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  onSuccess,
}: AddTargetModalProps) {
  const { toast } = useToast();
  const { fiscalYear } = useFiscalYearSelector();
  const [loading, setLoading] = useState(false);

  // Form state
  const [subcategory, setSubcategory] = useState('');
  const [measurement, setMeasurement] = useState('');
  const [unit, setUnit] = useState('');
  const [main, setMain] = useState('');
  const [fyTarget, setFyTarget] = useState('');
  const [totalTarget, setTotalTarget] = useState('');
  const [description, setDescription] = useState('');
  const [mainRelate, setMainRelate] = useState<string[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [customMeasurement, setCustomMeasurement] = useState(false);
  const [apiMeasurements, setApiMeasurements] = useState<any[]>([]);
  const [apiCategories, setApiCategories] = useState<any[]>([]);

  // Fetch measurements and categories from API
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        try {
          const mRes = await fetch(`/api/measurements?category_id=${categoryId}`, {
            headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
          });
          const mData = await mRes.json();
          if (mData.success) setApiMeasurements(mData.data || []);
          else if (mData.data) setApiMeasurements(mData.data);
        } catch {
          /* fallback to KPI_DATA below */
        }
        try {
          const cRes = await fetch('/api/kpi-forms/categories');
          const cData = await cRes.json();
          if (cData.success) setApiCategories(cData.data || []);
          else if (cData.data) setApiCategories(cData.data);
        } catch {
          /* silent */
        }
      };
      loadData();
    }
  }, [open, categoryId]);

  // Get category key from API categories
  const getCategoryKey = () => {
    const cat = apiCategories.find((c: any) => c.id === categoryId);
    return cat?.key || 'safety';
  };

  // Get available subcategories for current category from API measurements
  const getAvailableSubcategories = () => {
    if (apiMeasurements.length > 0) {
      const subCats = new Map<number, string>();
      apiMeasurements.forEach((m: any) => {
        if (m.sub_category_id && m.sub_category_name) {
          subCats.set(m.sub_category_id, m.sub_category_name);
        }
      });
      return Array.from(subCats.entries()).map(([id, name]) => ({ key: String(id), name }));
    }
    // Fallback to KPI_DATA
    const categoryKey = getCategoryKey();
    const categoryData = KPI_DATA[categoryKey as keyof typeof KPI_DATA];
    if (!categoryData) return [];
    return Object.keys(categoryData.subcategories).map((key) => ({
      key,
      name: (categoryData.subcategories[key as keyof typeof categoryData.subcategories] as any)
        .name,
    }));
  };

  // Get available measurements for selected subcategory
  const getAvailableMeasurements = () => {
    if (!subcategory) return [];

    // Use API measurements if available
    if (apiMeasurements.length > 0) {
      return apiMeasurements
        .filter((m: any) => String(m.sub_category_id) === subcategory)
        .map((m: any) => ({
          id: m.id,
          measurement: m.measurement || m.name,
          unit: m.unit,
          main: m.main_department_id || m.main || '',
          description: m.description || '',
          defaultTarget: 0,
        }));
    }

    // Fallback to KPI_DATA
    const categoryKey = getCategoryKey();
    const categoryData = KPI_DATA[categoryKey as keyof typeof KPI_DATA];
    if (!categoryData) return [];
    const subcategoryData = categoryData.subcategories[
      subcategory as keyof typeof categoryData.subcategories
    ] as any;
    if (!subcategoryData) return [];
    return subcategoryData.measurements;
  };

  // Get related departments for selected subcategory
  const getRelatedDepartments = () => {
    if (!subcategory) return [];

    // Use API measurements if available
    if (apiMeasurements.length > 0) {
      const subMeasurements = apiMeasurements.filter(
        (m: any) => String(m.sub_category_id) === subcategory
      );
      const deptSet = new Set<string>();
      subMeasurements.forEach((m: any) => {
        if (m.main_department_id) deptSet.add(m.main_department_id);
        if (m.related_departments) {
          String(m.related_departments)
            .split(',')
            .forEach((d: string) => {
              if (d.trim()) deptSet.add(d.trim());
            });
        }
      });
      return Array.from(deptSet);
    }

    // Fallback to KPI_DATA
    const categoryKey = getCategoryKey();
    const categoryData = KPI_DATA[categoryKey as keyof typeof KPI_DATA];
    if (!categoryData) return [];
    const subcategoryData = categoryData.subcategories[
      subcategory as keyof typeof categoryData.subcategories
    ] as any;
    if (!subcategoryData) return [];
    return subcategoryData.relatedDepts;
  };

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

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSubcategory('');
      setMeasurement('');
      setUnit('');
      setMain('');
      setFyTarget('');
      setTotalTarget('');
      setDescription('');
      setMainRelate([]);
      setCustomMeasurement(false);
    }
  }, [open]);

  // Handle subcategory change - reset related fields
  const handleSubcategoryChange = (value: string) => {
    setSubcategory(value);
    setMeasurement('');
    setUnit('');
    setMain('');
    setDescription('');
    setTotalTarget('');
    setFyTarget('');
    setCustomMeasurement(false);

    // Auto-select related departments based on subcategory
    if (value !== 'other') {
      const relatedDepts = getRelatedDepartments();
      setMainRelate(relatedDepts);
    }
  };

  // Handle measurement selection
  const handleMeasurementChange = (measurementId: string) => {
    const measurements = getAvailableMeasurements();
    const selectedMeasurement = measurements.find((m: any) => m.id.toString() === measurementId);

    if (selectedMeasurement) {
      setMeasurement(selectedMeasurement.measurement);
      setUnit(selectedMeasurement.unit);
      setMain(selectedMeasurement.main);
      setDescription(selectedMeasurement.description);
      setTotalTarget(selectedMeasurement.defaultTarget.toString());
      setFyTarget(selectedMeasurement.defaultTarget.toString());
      setCustomMeasurement(false);
    }
  };

  // Handle custom measurement
  const handleCustomMeasurement = () => {
    setCustomMeasurement(true);
    setMeasurement('');
    setUnit('');
    setMain('');
    setDescription('');
    setTotalTarget('');
    setFyTarget('');
    setMainRelate([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/kpi-forms/yearly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({
          category_id: categoryId,
          measurement,
          unit,
          main,
          main_relate_display: mainRelate.join(', '),
          total_target: parseFloat(totalTarget) || 0,
          fy_target: parseFloat(fyTarget) || 0,
          fiscal_year: fiscalYear,
          description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'KPI target created successfully',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data.message || 'Failed to create target');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const availableSubcategories = getAvailableSubcategories();
  const availableMeasurements = getAvailableMeasurements();
  const relatedDepartments = getRelatedDepartments();
  const unitDefinition = unit ? UNIT_DEFINITIONS[unit as keyof typeof UNIT_DEFINITIONS] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg font-bold">Add New KPI Target</span>
            <span className="text-sm text-gray-500">
              - {categoryName} FY{fiscalYear}
            </span>
          </DialogTitle>
          <DialogDescription>
            Create a new KPI target with structured data selection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-700 border-b pb-2">
              Basic Information
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* FY Target */}
              <div className="space-y-2">
                <Label htmlFor="fyTarget">FY Target</Label>
                <Select value={fyTarget} onValueChange={setFyTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select FY Target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FY25">FY25</SelectItem>
                    <SelectItem value="FY26">FY26</SelectItem>
                    <SelectItem value="FY27">FY27</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target */}
              <div className="space-y-2">
                <Label htmlFor="totalTarget">Target</Label>
                <Input
                  id="totalTarget"
                  type="number"
                  step="any"
                  placeholder="Enter target value"
                  value={totalTarget}
                  onChange={(e) => setTotalTarget(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* KPI Structure Section */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-700 border-b pb-2">KPI Structure</div>

            {/* Subcategory */}
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select value={subcategory} onValueChange={handleSubcategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map((sub) => (
                    <SelectItem key={sub.key} value={sub.key}>
                      {sub.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other" onSelect={handleCustomMeasurement}>
                    Other (Custom)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Measurement */}
            {subcategory && subcategory !== 'other' && (
              <div className="space-y-2">
                <Label htmlFor="measurement">Measurement</Label>
                <Select value={measurement} onValueChange={handleMeasurementChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select measurement" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMeasurements.map((m: any) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        <div className="flex flex-col">
                          <span>{m.measurement}</span>
                          <span className="text-xs text-gray-500">
                            Unit: {m.unit} | Main: {m.main}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" onSelect={handleCustomMeasurement}>
                      Other (Custom Measurement)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Measurement Input */}
            {(customMeasurement || subcategory === 'other') && (
              <div className="space-y-2">
                <Label htmlFor="customMeasurement">Custom Measurement</Label>
                <Input
                  id="customMeasurement"
                  placeholder="Enter custom measurement"
                  value={measurement}
                  onChange={(e) => setMeasurement(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UNIT_DEFINITIONS).map(([unitCode, definition]) => (
                    <SelectItem key={unitCode} value={unitCode}>
                      <div className="flex flex-col">
                        <span>{unitCode}</span>
                        <span className="text-xs text-gray-500">{definition.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unitDefinition && (
                <p className="text-xs text-gray-500">
                  Calculation type: {unitDefinition.type} - {unitDefinition.description}
                </p>
              )}
            </div>

            {/* Main KPI */}
            <div className="space-y-2">
              <Label htmlFor="main">Main KPI</Label>
              <Select value={main} onValueChange={setMain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select main KPI" />
                </SelectTrigger>
                <SelectContent>
                  {(departments.length > 0
                    ? departments.map((dept: any) => ({
                        code: dept.dept_id,
                        name: dept.name_en || dept.dept_id,
                      }))
                    : DEPARTMENTS
                  ).map((dept) => (
                    <SelectItem key={dept.code} value={dept.code}>
                      <div className="flex flex-col">
                        <span>{dept.code}</span>
                        <span className="text-xs text-gray-500">{dept.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Related Departments Section */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-700 border-b pb-2">
              Related Departments
            </div>

            <div className="space-y-2">
              <Label>Select Related Departments</Label>
              <div className="grid grid-cols-3 gap-3 max-h-40 overflow-y-auto p-2 border rounded-md">
                {(departments.length > 0
                  ? departments.map((dept: any) => ({
                      code: dept.dept_id,
                      name: dept.name_en || dept.dept_id,
                    }))
                  : DEPARTMENTS
                ).map((dept) => (
                  <div key={dept.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={dept.code}
                      checked={mainRelate.includes(dept.code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setMainRelate([...mainRelate, dept.code]);
                        } else {
                          setMainRelate(mainRelate.filter((d) => d !== dept.code));
                        }
                      }}
                    />
                    <Label htmlFor={dept.code} className="text-sm cursor-pointer">
                      <div className="flex flex-col">
                        <span>{dept.code}</span>
                        <span className="text-xs text-gray-500">{dept.name}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
              {relatedDepartments.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {relatedDepartments.map((dept: any) => (
                    <span
                      key={dept}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {dept}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-700 border-b pb-2">Description</div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of Target</Label>
              <Textarea
                id="description"
                placeholder="Enter target description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Target'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
