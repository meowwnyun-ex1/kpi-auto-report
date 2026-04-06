import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/Image';
import { AlertCircle, Upload, X, Loader2, ImageIcon as ImageIconIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BannerFormProps {
  banner?: any | null;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

const BannerForm: React.FC<BannerFormProps> = ({ banner, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: banner?.title || '',
    link_url: banner?.link_url || '',
    is_active: banner?.is_active ?? true,
    sort_order: banner?.sort_order || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [hasExistingImage, setHasExistingImage] = useState(!!banner?.image_thumbnail);

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (file: File) => {
    if (file) {
      setSelectedFile(file);
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
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setHasExistingImage(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.link_url.trim()) {
      newErrors.link_url = 'Link URL is required';
    } else if (
      !formData.link_url.startsWith('http://') &&
      !formData.link_url.startsWith('https://')
    ) {
      newErrors.link_url = 'URL must start with http:// or https://';
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
      submitData.append('title', formData.title);
      submitData.append('link_url', formData.link_url);
      submitData.append('is_active', formData.is_active.toString());
      submitData.append('sort_order', formData.sort_order.toString());

      if (selectedFile) {
        submitData.append('image', selectedFile);
      } else if (hasExistingImage && banner?.image_thumbnail) {
        submitData.append('keep_existing_image', 'true');
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save banner. Please try again.',
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
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <ImageIconIcon className="w-4 h-4 text-purple-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {banner ? 'Edit Banner' : 'Add New Banner'}
            </h1>
          </div>
          <p className="text-gray-600 text-sm">Manage banner display settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title and Link URL Fields - Same Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Banner Title
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter banner title"
                className={cn(
                  'h-9 sm:h-10 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500',
                  errors.title && 'border-red-500 bg-red-50'
                )}
              />
              {errors.title && (
                <p className="text-red-500 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Link URL Field */}
            <div className="space-y-2">
              <Label htmlFor="link_url" className="text-sm font-medium text-gray-700">
                Link URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="link_url"
                value={formData.link_url}
                onChange={(e) => handleChange('link_url', e.target.value)}
                placeholder="https://example.com"
                className={cn(
                  'h-9 sm:h-10 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500',
                  errors.link_url && 'border-red-500 bg-red-50'
                )}
              />
              {errors.link_url && (
                <p className="text-red-500 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.link_url}
                </p>
              )}
            </div>
          </div>

          {/* Status and Sort Order Fields - Same Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Status Toggle */}
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
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <Label htmlFor="is_active" className="text-sm text-gray-700">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>

            {/* Sort Order Field */}
            <div className="space-y-2">
              <Label htmlFor="sort_order" className="text-sm font-medium text-gray-700">
                Sort Order
                <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
              </Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleChange('sort_order', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="h-9 sm:h-10 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Banner Image
                <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
              </Label>
              <span className="text-xs text-gray-400">Recommended: Full width × 200px</span>
            </div>
            <div
              className={cn(
                'relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer',
                dragActive && 'border-purple-500 bg-purple-50'
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
                  <div className="relative">
                    <Image
                      src={filePreviewUrl}
                      alt="Banner preview"
                      className="w-full h-32 rounded-lg"
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
                      className="absolute top-2 right-2 text-xs bg-white/90 hover:bg-white">
                      <X className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : hasExistingImage && banner?.image_thumbnail ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Image
                      src={banner.image_thumbnail}
                      alt="Current banner image"
                      className="w-full h-32 rounded-lg"
                      fallbackType="error"
                      objectFit="cover"
                      lazy={false}
                    />
                    <div className="absolute bottom-2 left-2 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                      Current image - will be kept
                    </div>
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
                  <p className="text-xs text-gray-500">Click to upload a new image (optional)</p>
                  <p className="text-xs text-blue-600 font-medium">
                    Recommended: Full width × 200px
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Drop file here or click to browse</p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF, ICO, WebP up to 10MB</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      Recommended: Full width × 200px
                    </p>
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

export default BannerForm;
export { BannerForm };
