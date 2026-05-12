import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/layout';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/shared/utils';
import { Settings, Layers, Tag, FolderOpen, Target, Plus, Edit, Trash2 } from 'lucide-react';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminKPICategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<
    'hierarchy' | 'categories' | 'subcategories' | 'measurements'
  >('hierarchy');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'category' | 'subcategory' | 'measurement' | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({});

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
        if (categoriesData.success) setCategories(categoriesData.data);
      }

      if (subcategoriesRes.ok) {
        const subcategoriesData = await subcategoriesRes.json();
        if (subcategoriesData.success) setSubcategories(subcategoriesData.data);
      }

      if (measurementsRes.ok) {
        const measurementsData = await measurementsRes.json();
        if (measurementsData.success) setMeasurements(measurementsData.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (type: 'category' | 'subcategory' | 'measurement') => {
    setDialogType(type);
    setEditingItem(null);
    setFormData({});
    setDialogOpen(true);
  };

  const handleEdit = (item: any, type: 'category' | 'subcategory' | 'measurement') => {
    setDialogType(type);
    setEditingItem(item);
    setFormData(item);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const endpoint =
        type === 'category'
          ? '/api/admin/categories'
          : type === 'subcategory'
            ? '/api/admin/categories/subcategories'
            : '/api/admin/categories/measurements';

      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
        });
        loadDatabaseData();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    try {
      const endpoint =
        dialogType === 'category'
          ? '/api/admin/categories'
          : dialogType === 'subcategory'
            ? '/api/admin/categories/subcategories'
            : '/api/admin/categories/measurements';

      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${dialogType?.charAt(0).toUpperCase() + dialogType?.slice(1)} saved successfully`,
        });
        setDialogOpen(false);
        loadDatabaseData();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  // Render hierarchy view
  const renderHierarchy = () => {
    const grouped: any = {};

    categories.forEach((cat) => {
      grouped[cat.id] = {
        category: cat,
        subcategories: {},
      };
    });

    subcategories.forEach((sub) => {
      if (grouped[sub.category_id]) {
        grouped[sub.category_id].subcategories[sub.id] = {
          subcategory: sub,
          measurements: [],
        };
      }
    });

    measurements.forEach((meas) => {
      if (grouped[meas.category_id]) {
        const subId = meas.sub_category_id;
        if (subId && grouped[meas.category_id].subcategories[subId]) {
          grouped[meas.category_id].subcategories[subId].measurements.push(meas);
        } else {
          if (!grouped[meas.category_id].subcategories['none']) {
            grouped[meas.category_id].subcategories['none'] = {
              subcategory: null,
              measurements: [],
            };
          }
          grouped[meas.category_id].subcategories['none'].measurements.push(meas);
        }
      }
    });

    return (
      <div className="space-y-4">
        {Object.values(grouped).map((catGroup: any) => (
          <Card key={catGroup.category.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: catGroup.category.color || '#6b7280' }}
                  />
                  <CardTitle className="text-lg">{catGroup.category.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {catGroup.category.key}
                  </Badge>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(catGroup.category, 'category')}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(catGroup.category.id, 'category')}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 ml-4">
                {Object.values(catGroup.subcategories).map((subGroup: any) => (
                  <div
                    key={subGroup.subcategory?.id || 'none'}
                    className="border-l-2 border-l-purple-300 pl-4">
                    {subGroup.subcategory && (
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">{subGroup.subcategory.name}</span>
                        </div>
                        {canEdit && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(subGroup.subcategory, 'subcategory')}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(subGroup.subcategory.id, 'subcategory')}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-2 ml-4">
                      {subGroup.measurements.map((meas: any) => (
                        <div
                          key={meas.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm">{meas.measurement}</span>
                            <Badge variant="outline" className="text-xs">
                              {meas.unit}
                            </Badge>
                          </div>
                          {canEdit && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(meas, 'measurement')}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(meas.id, 'measurement')}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render table view
  const renderTable = (data: any[], type: string) => {
    const columns =
      type === 'categories'
        ? [
            { key: 'name', label: 'Category Name' },
            { key: 'key', label: 'Key Code' },
            { key: 'description', label: 'Description' },
            { key: 'status', label: 'Status' },
          ]
        : type === 'subcategories'
          ? [
              { key: 'name', label: 'Subcategory Name' },
              { key: 'category', label: 'Parent Category' },
              { key: 'created', label: 'Created Date' },
            ]
          : [
              { key: 'name', label: 'Measurement Name' },
              { key: 'unit', label: 'Unit Type' },
              { key: 'category', label: 'Category' },
              { key: 'subcategory', label: 'Subcategory' },
            ];

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              {type === 'categories' && (
                <>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color || '#6b7280' }}
                      />
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.key}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{item.description || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </>
              )}
              {type === 'subcategories' && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category_name || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                  </TableCell>
                </>
              )}
              {type === 'measurements' && (
                <>
                  <TableCell>{item.measurement}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.unit}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category_name || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.subcategory_name || 'N/A'}</Badge>
                  </TableCell>
                </>
              )}
              <TableCell className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(item, type.slice(0, -1) as any)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id, type.slice(0, -1))}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
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
        {/* View Mode Selector and Add Button */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
            onClick={() => setViewMode('hierarchy')}
            className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Hierarchy
          </Button>
          <Button
            variant={viewMode === 'categories' ? 'default' : 'outline'}
            onClick={() => setViewMode('categories')}
            className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Categories
          </Button>
          <Button
            variant={viewMode === 'subcategories' ? 'default' : 'outline'}
            onClick={() => setViewMode('subcategories')}
            className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Subcategories
          </Button>
          <Button
            variant={viewMode === 'measurements' ? 'default' : 'outline'}
            onClick={() => setViewMode('measurements')}
            className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Measurements
          </Button>
          {canEdit && viewMode !== 'hierarchy' && (
            <Button
              onClick={() =>
                handleAdd(
                  viewMode === 'categories'
                    ? 'category'
                    : viewMode === 'subcategories'
                      ? 'subcategory'
                      : 'measurement'
                )
              }
              className="ml-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add{' '}
              {viewMode === 'categories'
                ? 'Category'
                : viewMode === 'subcategories'
                  ? 'Subcategory'
                  : 'Measurement'}
            </Button>
          )}
        </div>

        {/* Content */}
        {viewMode === 'hierarchy'
          ? renderHierarchy()
          : viewMode === 'categories'
            ? renderTable(categories, 'categories')
            : viewMode === 'subcategories'
              ? renderTable(subcategories, 'subcategories')
              : renderTable(measurements, 'measurements')}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit' : 'Add'}{' '}
                {dialogType?.charAt(0).toUpperCase() + dialogType?.slice(1)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {dialogType === 'category' && (
                <>
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Key Code</Label>
                    <Input
                      value={formData.key || ''}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={formData.color || '#6b7280'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </>
              )}
              {dialogType === 'subcategory' && (
                <>
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Parent Category</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.category_id || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, category_id: parseInt(e.target.value) })
                      }>
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {dialogType === 'measurement' && (
                <>
                  <div>
                    <Label>Measurement Name</Label>
                    <Input
                      value={formData.measurement || ''}
                      onChange={(e) => setFormData({ ...formData, measurement: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit || ''}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.category_id || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, category_id: parseInt(e.target.value) })
                      }>
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Subcategory</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.sub_category_id || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sub_category_id: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }>
                      <option value="">None</option>
                      {subcategories
                        .filter((s) => s.category_id === formData.category_id)
                        .map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </StandardPageLayout>
    </ShellLayout>
  );
}
