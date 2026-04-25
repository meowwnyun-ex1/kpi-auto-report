import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface KPIEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editType: 'category' | 'subcategory' | 'measurement';
  onEdit: () => void;
}

export function KPIEditDialog({ open, onOpenChange, editType, onEdit }: KPIEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Edit{' '}
            {editType === 'category'
              ? 'Category'
              : editType === 'subcategory'
                ? 'Subcategory'
                : 'Measurement'}
          </DialogTitle>
          <DialogDescription>
            Make changes to the KPI structure. This will affect all related data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {editType === 'category' && (
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input id="categoryName" placeholder="Enter category name" />
            </div>
          )}

          {editType === 'subcategory' && (
            <div className="space-y-2">
              <Label htmlFor="subcategoryName">Subcategory Name</Label>
              <Input id="subcategoryName" placeholder="Enter subcategory name" />
            </div>
          )}

          {editType === 'measurement' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="measurementName">Measurement Name</Label>
                <Input id="measurementName" placeholder="Enter measurement name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" placeholder="Enter unit" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="main">Main Department</Label>
                <Input id="main" placeholder="Enter main department" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTarget">Default Target</Label>
                <Input id="defaultTarget" type="number" placeholder="Enter default target" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter description" rows={3} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onEdit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default KPIEditDialog;
