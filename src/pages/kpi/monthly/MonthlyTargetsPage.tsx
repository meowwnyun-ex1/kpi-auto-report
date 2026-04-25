import React from 'react';
import { ShellLayout } from '@/components/layout';
import { StandardPageLayout } from '@/shared/components/StandardPageLayout';
import { MonthlyTargetsTable } from './MonthlyTargetsTable';

export default function MonthlyTargetsPage() {
  return (
    <ShellLayout variant="user">
      <StandardPageLayout title="Monthly Targets" description="Set and manage monthly KPI targets">
        <MonthlyTargetsTable />
      </StandardPageLayout>
    </ShellLayout>
  );
}
