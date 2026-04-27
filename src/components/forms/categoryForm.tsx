import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/Image';
import { AlertCircle, Upload, X, Loader2, Folder } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/shared/utils';
import { useToast } from '@/shared/hooks/use-toast';
import type { KPICategory } from '@/shared/types';
type Category = KPICategory & { image_thumbnail?: string };

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  categories?: Category[];
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  categories = [],
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: category?.name || '',
    is_active: category?.is_active ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>(
    (category as any)?.image_thumbnail || ''
  );
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (file: File) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
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
    setSelectedFile(null);
    if (filePreviewUrl && !category?.image_thumbnail) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFilePreviewUrl(category?.image_thumbnail || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (
      categories.some(
        (c) => c.name.toLowerCase() === formData.name.toLowerCase() && c.id !== category?.id
      )
    ) {
      newErrors.name = 'Category with this name already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('is_active', formData.is_active.toString());

      if (selectedFile) {
        submitData.append('icon', selectedFile);
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save category. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="flex-1 bg-white/90 backdrop-blur-md border-gray-200/60 shadow-sm overflow-hidden">
      <CardContent className="flex flex-col h-full p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Folder className="w-4 h-4 text-orange-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {category ? 'Edit Category' : 'Add New Category'}
            </h1>
          </div>
          <p className="text-gray-600 text-sm">Create and manage application categories</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Category Name
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter category name"
              className={cn(
                'h-9 sm:h-10 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
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

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Status
              <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
            </Label>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <Label htmlFor="is_active" className="text-sm text-gray-700">
                {formData.is_active ? 'Active' : 'Inactive'}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Category Icon
                <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
              </Label>
              <span className="text-xs text-gray-400">Recommended: 64×64 px</span>
            </div>
            <div
              className={cn(
                'relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer',
                dragActive && 'border-orange-500 bg-orange-50'
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

              {selectedFile || filePreviewUrl ? (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <Image
                      src={filePreviewUrl}
                      alt="Category icon preview"
                      className="w-20 h-20 rounded-lg object-cover mx-auto"
                      fallbackType="error"
                      objectFit="cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="absolute -top-2 -right-2 text-xs bg-white/90 hover:bg-white w-6 h-6 p-0 rounded-full">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {selectedFile && <p className="text-xs text-gray-500">{selectedFile.name}</p>}
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

export default CategoryForm;
export { CategoryForm };
