import { useMemo } from 'react';
import {
  Shield,
  Award,
  Truck,
  FileCheck,
  Users,
  Star,
  Leaf,
  DollarSign,
  Settings,
} from 'lucide-react';

// Mock KPI data structure
const KPI_DATA = {
  safety: {
    name: 'Safety',
    icon: Shield,
    color: '#DC2626',
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
            default_target: 0,
          },
          {
            id: 2,
            measurement: 'Reoccurrence',
            unit: 'Case',
            main: 'SE',
            description: '',
            default_target: 0,
          },
          {
            id: 3,
            measurement: 'Nearm',
            unit: 'Case',
            main: 'SE',
            description: '(Reduce 50% from FY24)',
            default_target: 4,
          },
          {
            id: 4,
            measurement: '8-High risk audit',
            unit: 'Case',
            main: 'SE',
            description: '(Reduce 50% from FY24)',
            default_target: 4,
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
            default_target: 0,
          },
          {
            id: 6,
            measurement: 'Injury',
            unit: 'Case',
            main: 'GA',
            description: '',
            default_target: 0,
          },
          {
            id: 7,
            measurement: 'Illegal & dangerous driving',
            unit: 'Case',
            main: 'GA',
            description: '',
            default_target: 0,
          },
          {
            id: 8,
            measurement: 'Hit',
            unit: 'Case',
            main: 'GA',
            description: '',
            default_target: 0,
          },
          {
            id: 9,
            measurement: 'Been-hit & Other',
            unit: 'Case',
            main: 'GA',
            description: '',
            default_target: 0,
          },
        ],
        relatedDepts: ['GA', 'All'],
      },
    },
  },
  quality: {
    name: 'Quality',
    icon: Award,
    color: '#16A34A',
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
            default_target: 0,
          },
          {
            id: 11,
            measurement: '0-km claim (Official)',
            unit: 'Case',
            main: 'QA',
            description: '',
            default_target: 4,
          },
          {
            id: 12,
            measurement: '0-km claim (All DN response)',
            unit: 'Case',
            main: 'QA',
            description: '',
            default_target: 9,
          },
          {
            id: 13,
            measurement: 'OGC claim',
            unit: 'Case',
            main: 'QA',
            description: '',
            default_target: 6,
          },
          {
            id: 14,
            measurement: 'Supplier NCR',
            unit: 'Case',
            main: 'QC',
            description: '',
            default_target: 6,
          },
          {
            id: 15,
            measurement: 'Internal NCR',
            unit: 'Case',
            main: 'QC',
            description: '',
            default_target: 5,
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
            default_target: 0.56,
          },
          {
            id: 17,
            measurement: 'Cost of spoilage',
            unit: 'MB',
            main: 'PD',
            description: '',
            default_target: 162.9,
          },
          {
            id: 18,
            measurement: 'Quality loss',
            unit: 'MB',
            main: 'AC',
            description: '',
            default_target: 231.814,
          },
        ],
        relatedDepts: ['PD', 'PC', 'PE', 'QC', 'QA'],
      },
    },
  },
  delivery: {
    name: 'Delivery',
    icon: Truck,
    color: '#2563EB',
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
            default_target: 130,
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
            default_target: 0,
          },
        ],
        relatedDepts: ['MT', 'PE', 'PC'],
      },
      on_plan: {
        name: 'On plan delivery',
        measurements: [
          { id: 21, measurement: '-', unit: '%', main: 'WH', description: '', default_target: 100 },
        ],
        relatedDepts: ['WH', 'PD', 'PC'],
      },
      nearmiss: {
        name: 'Nearmiss delivery delay > 30 mins',
        measurements: [
          {
            id: 22,
            measurement: '-',
            unit: 'Case',
            main: 'WH',
            description: '',
            default_target: 0,
          },
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
            default_target: 7.65,
          },
        ],
        relatedDepts: ['PC', 'PD'],
      },
    },
  },
  compliance: {
    name: 'Compliance',
    icon: FileCheck,
    color: '#9333EA',
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
            default_target: 0,
          },
          {
            id: 25,
            measurement: 'Nearmiss',
            unit: 'Case',
            main: 'AR',
            description: '',
            default_target: 0,
          },
          {
            id: 26,
            measurement: 'Incident',
            unit: 'Case',
            main: 'AR',
            description: '',
            default_target: 0,
          },
          {
            id: 27,
            measurement: 'Urgent purchasing',
            unit: 'Case',
            main: 'PU',
            description: '<280',
            default_target: 280,
          },
          {
            id: 28,
            measurement: 'Urgent purchasing',
            unit: 'MB',
            main: 'PU',
            description: '<106',
            default_target: 106,
          },
          {
            id: 29,
            measurement: 'Urgent purchasing clear within3 Month',
            unit: 'Case',
            main: 'PU',
            description: '',
            default_target: 0,
          },
          {
            id: 30,
            measurement: 'Urgent purchasing clear within3 Month',
            unit: 'MB',
            main: 'PU',
            description: '',
            default_target: 0,
          },
          {
            id: 31,
            measurement: 'Special purchasing',
            unit: 'Case',
            main: 'PU',
            description: '<192',
            default_target: 192,
          },
          {
            id: 32,
            measurement: 'Special purchasing',
            unit: 'MB',
            main: 'PU',
            description: '<307',
            default_target: 307,
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
            default_target: 0,
          },
          {
            id: 34,
            measurement: 'Lead to incident',
            unit: 'Case',
            main: 'GA&CSR',
            description: '',
            default_target: 0,
          },
          {
            id: 35,
            measurement: 'Nearmiss',
            unit: 'Case',
            main: 'GA&CSR',
            description: '',
            default_target: 0,
          },
          {
            id: 36,
            measurement: 'E-mail traing result',
            unit: 'Case',
            main: 'GA&CSR',
            description: '',
            default_target: 5,
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
            default_target: 0,
          },
          {
            id: 38,
            measurement: 'Nearmiss',
            unit: 'Case',
            main: 'AR&AS',
            description: '',
            default_target: 0,
          },
          {
            id: 39,
            measurement: 'Incident',
            unit: 'Case',
            main: 'AR&AS',
            description: '',
            default_target: 0,
          },
        ],
        relatedDepts: ['AR', 'AS', 'All'],
      },
    },
  },
  hr: {
    name: 'HR',
    icon: Users,
    color: '#EA580C',
    subcategories: {
      voice: {
        name: 'Voice of employee (Bad News First)',
        measurements: [
          {
            id: 44,
            measurement: '-',
            unit: 'Case',
            main: 'AR',
            description: '',
            default_target: 0,
          },
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
            default_target: 0,
          },
          {
            id: 46,
            measurement: 'Dept. Training',
            unit: 'Persons/%',
            main: 'HRD',
            description: '',
            default_target: 0,
          },
          {
            id: 47,
            measurement: 'Mgmt. Training',
            unit: '%',
            main: 'HRD',
            description: '',
            default_target: 100,
          },
          {
            id: 48,
            measurement: 'Pre boarding promotion',
            unit: 'Case',
            main: 'HRD',
            description: '',
            default_target: 0,
          },
          {
            id: 49,
            measurement: 'Post boarding promotion',
            unit: 'Case',
            main: 'HRD',
            description: '',
            default_target: 0,
          },
        ],
        relatedDepts: ['HRD', 'All'],
      },
      engagement: {
        name: 'Engagement',
        measurements: [
          {
            id: 50,
            measurement: '-',
            unit: 'Case',
            main: 'PD',
            description: '',
            default_target: 0,
          },
          {
            id: 51,
            measurement: '-',
            unit: 'Case',
            main: 'AR',
            description: '3.20 points',
            default_target: 3.2,
          },
        ],
        relatedDepts: ['PD', 'AR', 'All'],
      },
    },
  },
  attractive: {
    name: 'Attractive',
    icon: Star,
    color: '#DB2777',
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
            default_target: 33,
          },
          {
            id: 53,
            measurement: 'Indirect',
            unit: 'Case',
            main: 'PE',
            description: 'Indirect 10%',
            default_target: 10,
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
            default_target: 70,
          },
        ],
        relatedDepts: ['INN'],
      },
    },
  },
  environment: {
    name: 'Environment',
    icon: Leaf,
    color: '#0D9488',
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
            default_target: 40244,
          },
          {
            id: 56,
            measurement: 'CO2 basic unit',
            unit: 'ton/VAP-MB',
            main: 'MT',
            description: '',
            default_target: -2,
          },
          {
            id: 57,
            measurement: 'Energy saving',
            unit: '%',
            main: 'MT',
            description: '',
            default_target: -7,
          },
          {
            id: 58,
            measurement: 'Energy saving',
            unit: 'ton',
            main: 'MT',
            description: '',
            default_target: -3020,
          },
          {
            id: 59,
            measurement: 'Energy saving day',
            unit: 'Day',
            main: 'MT',
            description: '',
            default_target: 39,
          },
          {
            id: 60,
            measurement: 'Energy cost (Electricity + Natural gas +N2)',
            unit: 'MB',
            main: 'MT',
            description: '<251.99',
            default_target: 251.99,
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
            default_target: 292915,
          },
          {
            id: 62,
            measurement: 'Water reduciton',
            unit: 'm3/VAP-MB',
            main: 'MT',
            description: '',
            default_target: -1,
          },
          {
            id: 63,
            measurement: 'Water cost (Water treatment + Wastewater)',
            unit: 'MB',
            main: 'MT',
            description: '<8.84',
            default_target: 8.84,
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
            default_target: 0.192,
          },
          {
            id: 65,
            measurement: 'Waste reduction (Ton)',
            unit: 'Ton',
            main: 'SE',
            description: '"< 3,298 Tons (As sale forcast 17,182.)"',
            default_target: 17182,
          },
        ],
        relatedDepts: ['SE', 'PD', 'PE', 'All'],
      },
    },
  },
  cost: {
    name: 'Cost',
    icon: DollarSign,
    color: '#4F46E5',
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
            default_target: 31107.79,
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
            default_target: 3713.11,
          },
          {
            id: 68,
            measurement: 'Ratio',
            unit: '%',
            main: 'ACC',
            description: '',
            default_target: 11.9,
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
            default_target: 45.45,
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
            default_target: 9.95,
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
            default_target: 100,
          },
          {
            id: 72,
            measurement: 'Direct (Ninku)',
            unit: 'Ninku',
            main: 'ACC',
            description: '"All (IOT, DX, Attractive etc.)"',
            default_target: 1200,
          },
          {
            id: 73,
            measurement: 'Indirect (%)',
            unit: '%',
            main: 'ACC',
            description: '"All (IOT, DX, Attractive etc.)"',
            default_target: 100,
          },
          {
            id: 74,
            measurement: 'Indirect (Ninku)',
            unit: 'Ninku',
            main: 'ACC',
            description: '"All (IOT, DX, Attractive etc.)"',
            default_target: 1200,
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
            default_target: 1174,
          },
          {
            id: 76,
            measurement: 'Indirect',
            unit: 'MB',
            main: 'ACC',
            description: 'All',
            default_target: 962,
          },
        ],
        relatedDepts: ['ACC', 'All'],
      },
    },
  },
};

export function useKPIData(categories: any[], subcategories: any[], measurements: any[]) {
  // Calculate statistics from database or fallback to mock data
  const totalCategories = useMemo(
    () => (categories.length > 0 ? categories.length : Object.keys(KPI_DATA).length),
    [categories.length]
  );

  const totalSubcategories = useMemo(
    () =>
      subcategories.length > 0
        ? subcategories.length
        : Object.values(KPI_DATA).reduce(
            (sum, cat) => sum + Object.keys(cat.subcategories).length,
            0
          ),
    [subcategories.length]
  );

  const totalMeasurements = useMemo(
    () =>
      measurements.length > 0
        ? measurements.length
        : Object.values(KPI_DATA).reduce(
            (sum, cat) =>
              sum +
              Object.values(cat.subcategories).reduce(
                (subSum, sub) => subSum + sub.measurements.length,
                0
              ),
            0
          ),
    [measurements.length]
  );

  // Get category data from database or fallback to mock data
  const getCategoryData = (categoryKey: string) => {
    // Try database first
    if (categories.length > 0) {
      const category = categories.find((c) => c.key === categoryKey);
      if (category) {
        const categorySubcategories = subcategories.filter((sc) => sc.category_id === category.id);
        const categoryMeasurements = measurements.filter((m) =>
          categorySubcategories.some((sc) => sc.id === m.subcategory_id)
        );

        return {
          ...category,
          subcategories: categorySubcategories.reduce((acc, sc) => {
            acc[sc.key] = {
              ...sc,
              measurements: categoryMeasurements.filter((m) => m.subcategory_id === sc.id),
            };
            return acc;
          }, {} as any),
        };
      }
    }

    // Fallback to mock data
    const mockCategory = KPI_DATA[categoryKey as keyof typeof KPI_DATA];
    if (!mockCategory) return null;

    return {
      id: mockCategory.name.toLowerCase(),
      key: categoryKey,
      name: mockCategory.name,
      subcategories: mockCategory.subcategories,
    };
  };

  // Get category stats
  const getCategoryStats = (categoryKey: string) => {
    const categoryData = getCategoryData(categoryKey);
    if (!categoryData) return { subcategories: 0, measurements: 0 };

    const subcategories = Object.keys(categoryData.subcategories).length;
    const measurements = Object.values(categoryData.subcategories).reduce(
      (sum: number, sub: any) => sum + (sub.measurements?.length || 0),
      0
    );

    return { subcategories, measurements };
  };

  // Get icon for category
  const getCategoryIcon = (categoryKey: string) => {
    const iconMap: Record<string, any> = {
      safety: Shield,
      quality: Award,
      delivery: Truck,
      compliance: FileCheck,
      hr: Users,
      attractive: Star,
      environment: Leaf,
      cost: DollarSign,
    };
    return iconMap[categoryKey] || Settings;
  };

  // Get color for category
  const getCategoryColor = (categoryKey: string) => {
    const colorMap: Record<string, string> = {
      safety: '#DC2626',
      quality: '#16A34A',
      delivery: '#2563EB',
      compliance: '#9333EA',
      hr: '#EA580C',
      attractive: '#DB2777',
      environment: '#0D9488',
      cost: '#4F46E5',
    };
    return colorMap[categoryKey] || '#6B7280';
  };

  return {
    totalCategories,
    totalSubcategories,
    totalMeasurements,
    getCategoryData,
    getCategoryStats,
    getCategoryIcon,
    getCategoryColor,
  };
}
