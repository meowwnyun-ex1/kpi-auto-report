import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/shared/utils';
import { TOAST_MESSAGES } from '@/shared/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Shield, Settings, Save, Loader2 } from 'lucide-react';
import { StandardPageLayout } from '@/components/shared/StandardPageLayout';

interface SystemSettings {
  fiscal_year: number;
  default_language: string;
  company_name: string;
  report_due_day: number;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<SystemSettings>({
    fiscal_year: new Date().getFullYear(),
    default_language: 'th',
    company_name: 'DENSO',
    report_due_day: 5,
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Simulate save - in real app, would call API
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({ title: 'Success', description: 'Settings saved successfully' });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: TOAST_MESSAGES.SAVE_FAILED,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <ShellLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold">Access Denied</h2>
              <p className="text-muted-foreground">Admin privileges required.</p>
            </CardContent>
          </Card>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <StandardPageLayout
        title="Settings"
        icon={Settings}
        iconColor="text-gray-600"
        onRefresh={() => {}}
        loading={false}
        theme="gray">
        <div className="grid gap-6 md:grid-cols-2">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fiscal Year</Label>
                <Select
                  value={settings.fiscal_year.toString()}
                  onValueChange={(v) => setSettings({ ...settings, fiscal_year: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select
                  value={settings.default_language}
                  onValueChange={(v) => setSettings({ ...settings, default_language: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="th">Thai</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Report Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Settings</CardTitle>
              <CardDescription>KPI report configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Report Due Day (each month)</Label>
                <Select
                  value={settings.report_due_day.toString()}
                  onValueChange={(v) => setSettings({ ...settings, report_due_day: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 10, 15, 20, 25].map((d) => (
                      <SelectItem key={d} value={d.toString()}>
                        Day {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </StandardPageLayout>
    </ShellLayout>
  );
}
