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

interface KPIAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addType: 'category' | 'subcategory' | 'measurement';
  onAdd: () => void;
}

export function KPIAddDialog({ open, onOpenChange, addType, onAdd }: KPIAddDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Add New{' '}
            {addType === 'category'
              ? 'Category'
              : addType === 'subcategory'
                ? 'Subcategory'
                : 'Measurement'}
          </DialogTitle>
          <DialogDescription>Add a new item to the KPI structure.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {addType === 'category' && (
            <div className="space-y-2">
              <Label htmlFor="newCategoryName">Category Name</Label>
              <Input id="newCategoryName" placeholder="Enter category name" />
            </div>
          )}

          {addType === 'subcategory' && (
            <div className="space-y-2">
              <Label htmlFor="newSubcategoryName">Subcategory Name</Label>
              <Input id="newSubcategoryName" placeholder="Enter subcategory name" />
            </div>
          )}

          {addType === 'measurement' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newMeasurementName">Measurement Name</Label>
                <Input id="newMeasurementName" placeholder="Enter measurement name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUnit">Unit</Label>
                <Input id="newUnit" placeholder="Enter unit" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newMain">Main Department</Label>
                <Input id="newMain" placeholder="Enter main department" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDefaultTarget">Default Target</Label>
                <Input id="newDefaultTarget" type="number" placeholder="Enter default target" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDescription">Description</Label>
                <Textarea id="newDescription" placeholder="Enter description" rows={3} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAdd}>Add {addType}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default KPIAddDialog;
