import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/layout';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/shared/utils';
import { Settings } from 'lucide-react';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';

// Import components
import { KPIOverview } from '../components/KPIOverview';

export default function AdminKPICategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Database data states
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);

  const canEdit = ['admin', 'superadmin'].includes(user?.role ?? '');

  // Load data from database
  useEffect(() => {
    loadDatabaseData();
  }, []);

  const loadDatabaseData = async () => {
    setLoading(true);
    try {
      console.log('Loading KPI categories data...');

      // Load categories, subcategories, and measurements in parallel
      const [categoriesRes, subcategoriesRes, measurementsRes] = await Promise.all([
        fetch('/api/admin/categories', {
          headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        }),
        fetch('/api/admin/categories/subcategories', {
          headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        }),
        fetch('/api/admin/categories/measurements', {
          headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        }),
      ]);

      console.log('Categories response:', categoriesRes.status);
      console.log('Subcategories response:', subcategoriesRes.status);
      console.log('Measurements response:', measurementsRes.status);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        console.log('Categories data:', categoriesData);
        if (categoriesData.success) {
          setCategories(categoriesData.data);
          console.log('Categories loaded:', categoriesData.data.length);
        }
      } else {
        console.error('Categories API failed:', categoriesRes.status);
      }

      if (subcategoriesRes.ok) {
        const subcategoriesData = await subcategoriesRes.json();
        if (subcategoriesData.success) {
          setSubcategories(subcategoriesData.data);
          console.log('Subcategories loaded:', subcategoriesData.data.length);
        }
      } else {
        console.error('Subcategories API failed:', subcategoriesRes.status);
      }

      if (measurementsRes.ok) {
        const measurementsData = await measurementsRes.json();
        if (measurementsData.success) {
          setMeasurements(measurementsData.data);
          console.log('Measurements loaded:', measurementsData.data.length);
        }
      } else {
        console.error('Measurements API failed:', measurementsRes.status);
      }
    } catch (error) {
      console.error('Failed to load database data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: 'category' | 'subcategory' | 'measurement') => {
    toast({
      title: 'Edit',
      description: `Edit ${type} functionality coming soon`,
    });
  };

  const handleAdd = (type: 'category' | 'subcategory' | 'measurement') => {
    toast({
      title: 'Add',
      description: `Add ${type} functionality coming soon`,
    });
  };

  return (
    <ShellLayout>
      <StandardPageLayout
        title="KPI Configuration"
        icon={Settings}
        iconColor="text-purple-600"
        theme="purple"
        onRefresh={loadDatabaseData}
        loading={loading}>
        {/* Main Content */}
        <KPIOverview
          activeTab={activeTab}
          activeCategory={null}
          activeSubcategory={null}
          categories={categories}
          subcategories={subcategories}
          measurements={measurements}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          canEdit={canEdit}
          loading={loading}
          onCategorySelect={() => {}}
          onSubcategorySelect={() => {}}
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
      </StandardPageLayout>
    </ShellLayout>
  );
}
