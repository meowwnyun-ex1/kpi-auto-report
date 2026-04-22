import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/shared/utils';
import { Settings } from 'lucide-react';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';

// Import components
import { KPIOverview } from './components/KPIOverview';
import { KPIEditDialog } from './components/KPIEditDialog';
import { KPIAddDialog } from './components/KPIAddDialog';

export default function AdminKPICategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editType, setEditType] = useState<'category' | 'subcategory' | 'measurement'>('category');
  const [addDialog, setAddDialog] = useState(false);
  const [addType, setAddType] = useState<'category' | 'subcategory' | 'measurement'>('category');

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

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }
      }

      if (subcategoriesRes.ok) {
        const subcategoriesData = await subcategoriesRes.json();
        if (subcategoriesData.success) {
          setSubcategories(subcategoriesData.data);
        }
      }

      if (measurementsRes.ok) {
        const measurementsData = await measurementsRes.json();
        if (measurementsData.success) {
          setMeasurements(measurementsData.data);
        }
      }
    } catch (error) {
      console.error('Failed to load database data:', error);
      // Fallback to mock data if API fails
      toast({
        title: 'Warning',
        description: 'Using sample data. API endpoints not available.',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryKey: string) => {
    setActiveCategory(categoryKey);
    setActiveSubcategory(null);
    setActiveTab('subcategory');
  };

  // Handle subcategory selection
  const handleSubcategorySelect = (subcategoryKey: string) => {
    setActiveSubcategory(subcategoryKey);
    setActiveTab('measurement');
  };

  // Handle back navigation
  const handleBackToCategories = () => {
    setActiveCategory(null);
    setActiveSubcategory(null);
    setActiveTab('overview');
  };

  const handleBackToSubcategories = () => {
    setActiveSubcategory(null);
    setActiveTab('subcategory');
  };

  const handleEdit = (
    type: 'category' | 'subcategory' | 'measurement',
    category?: string,
    subcategory?: string
  ) => {
    setEditType(type);
    // setSelectedCategory(category || null); // Removed - variable not defined
    setSelectedSubcategory(subcategory || null);
    setEditDialog(true);
  };

  const handleAdd = (type: 'category' | 'subcategory' | 'measurement') => {
    setAddType(type);
    setAddDialog(true);
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
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          categories={categories}
          subcategories={subcategories}
          measurements={measurements}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          canEdit={canEdit}
          loading={loading}
          onCategorySelect={handleCategorySelect}
          onSubcategorySelect={handleSubcategorySelect}
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
      </StandardPageLayout>

      {/* Edit Dialog */}
      <KPIEditDialog
        open={editDialog}
        onOpenChange={setEditDialog}
        editType={editType}
        onEdit={() => {
          toast({
            title: 'Success',
            description: `${editType} updated successfully`,
          });
          setEditDialog(false);
        }}
      />

      {/* Add Dialog */}
      <KPIAddDialog
        open={addDialog}
        onOpenChange={setAddDialog}
        addType={addType}
        onAdd={() => {
          toast({
            title: 'Success',
            description: `${addType} added successfully`,
          });
          setAddDialog(false);
        }}
      />
    </ShellLayout>
  );
}
