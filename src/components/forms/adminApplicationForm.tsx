import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Loader2, Upload, X, Package } from 'lucide-react';
import { Category } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageDisplay } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLoading } from '@/contexts/LoadingContext';
import { useToast } from '@/hooks/use-toast';

export interface AdminApplicationFormProps {
  categories: Category[];
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  initialData?: any;
  compact?: boolean;
}

const AdminApplicationForm: React.FC<AdminApplicationFormProps> = ({
  categories,
  onSubmit,
  onCancel,
  mode = 'create',
  initialData,
  compact = false,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const { startLoading, stopLoading } = useLoading();

  // Form state
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    url: initialData?.url || '',
    categoryId: initialData?.category_id ? String(initialData.category_id) : '',
    status: initialData?.status || 'approved', // Default to approved for admin
  });

  // Initialize file preview with existing icon
  useEffect(() => {
    if (initialData?.image_thumbnail && !selectedFile) {
      setFilePreviewUrl(initialData.image_thumbnail);
    }
  }, [initialData?.image_thumbnail, selectedFile]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, categoryId: value }));
    if (errors.categoryId) {
      setErrors((prev) => ({ ...prev, categoryId: '' }));
    }
  };

  const handleFileSelect = (file: File) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);

      // Clean up previous URL if exists
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }

      // Create new blob URL
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    // Clean up blob URL
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl('');
    }

    setSelectedFile(null);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
      newErrors.url = 'URL must start with http:// or https://';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    startLoading(mode === 'edit' ? 'Saving changes...' : 'Creating application...', 'Admin');

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('url', formData.url);
      submitData.append('categoryId', formData.categoryId);
      submitData.append('status', formData.status); // Admin sets status directly
      submitData.append('isAdmin', 'true'); // Flag to skip email notification

      if (selectedFile) {
        submitData.append('icon', selectedFile);
      }

      // Keep existing icon if editing and no new file selected
      if (initialData?.image_thumbnail && !selectedFile) {
        submitData.append('keep_existing_icon', 'true');
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Submit error:', error);
      stopLoading();
      toast({
        title: 'Error',
        description: 'Failed to save application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      stopLoading();
    }
  };

  const getFormTitle = () => {
    return mode === 'edit' ? 'Edit Application' : 'Add New Application';
  };

  const getFormSubtitle = () => {
    return mode === 'edit'
      ? 'Update application details and settings'
      : 'Create a new application with custom status';
  };

  return (
    <Card className="flex-1 bg-white/90 backdrop-blur-md border-gray-200/60 shadow-sm overflow-hidden">
      <CardContent className={cn('flex flex-col h-full p-4 sm:p-6', compact && 'p-3 sm:p-4')}>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{getFormTitle()}</h1>
          </div>
          <p className="text-gray-600 text-sm">{getFormSubtitle()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name and URL Fields - Same Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Application Name
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter application name"
                className={cn(
                  'h-9 sm:h-10 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.name && 'border-red-500 bg-red-50'
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* URL Field */}
            <div className="space-y-2">
              <Label htmlFor="url" className="text-sm font-medium text-gray-700">
                Application URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://example.com"
                className={cn(
                  'h-9 sm:h-10 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.url && 'border-red-500 bg-red-50'
                )}
              />
              {errors.url && (
                <p className="text-red-500 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.url}
                </p>
              )}
            </div>
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Category
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-10 sm:h-11 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow">
                <SelectValue placeholder="Select a category" className="text-gray-500" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg border-0">
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id.toString()}
                    className="cursor-pointer hover:bg-blue-50 focus:bg-blue-100 rounded-md transition-colors duration-150 py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {category.image_thumbnail ? (
                        <ImageDisplay
                          src={category.image_thumbnail}
                          alt={category.name}
                          className="w-5 h-5 object-cover rounded"
                          fallbackText="📁"
                        />
                      ) : category.icon && category.icon.startsWith('data:') ? (
                        <ImageDisplay
                          src={category.icon}
                          alt={category.name}
                          className="w-5 h-5 object-cover rounded"
                          fallbackText="📁"
                        />
                      ) : category.icon ? (
                        <span className="text-lg">{category.icon}</span>
                      ) : (
                        <span className="text-lg">📁</span>
                      )}
                      <span className="text-base font-medium">{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.categoryId}
              </p>
            )}
          </div>

          {/* Status Field - Always visible for Admin */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Status
              <span className="text-blue-500 ml-1 text-xs">(Admin Control)</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger className="h-10 sm:h-11 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow">
                <SelectValue placeholder="Select status" className="text-gray-500" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg border-0">
                <SelectItem
                  value="pending"
                  className="cursor-pointer hover:bg-yellow-50 focus:bg-yellow-100 rounded-md transition-colors duration-150 py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Pending</span>
                    <span className="text-xs text-gray-400">- Waiting for review</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="approved"
                  className="cursor-pointer hover:bg-green-50 focus:bg-green-100 rounded-md transition-colors duration-150 py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Approved</span>
                    <span className="text-xs text-gray-400">- Visible to users</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="rejected"
                  className="cursor-pointer hover:bg-red-50 focus:bg-red-100 rounded-md transition-colors duration-150 py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Rejected</span>
                    <span className="text-xs text-gray-400">- Not visible</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Admin can set status directly.</p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Application Icon</Label>
              <span className="text-xs text-gray-400">Recommended: 64×64 px</span>
            </div>
            <div
              className={cn(
                'relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer',
                dragActive && 'border-blue-500 bg-blue-50'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-3">
                  {filePreviewUrl ? (
                    <div className="relative">
                      <ImageDisplay
                        src={filePreviewUrl}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200 mx-auto"
                        fallbackText="📱"
                        optimized={false}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="absolute top-2 right-2 text-xs bg-white/90 hover:bg-white">
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-gray-600 truncate">{selectedFile.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile();
                          }}
                          className="text-xs">
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 text-center">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                </div>
              ) : initialData?.image_thumbnail ? (
                <div className="space-y-3">
                  <div className="relative">
                    <ImageDisplay
                      src={initialData.image_thumbnail}
                      alt="Current icon"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 mx-auto"
                      fallbackText="📱"
                      optimized={true}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm">Click to change icon</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Drop file here or click to browse</p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF, ICO, WebP up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={submitting}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 h-9 sm:h-10">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 h-9 sm:h-10">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { AdminApplicationForm };
export default AdminApplicationForm;
