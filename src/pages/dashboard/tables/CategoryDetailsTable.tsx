import React from 'react';
import { TableContainer } from '@/shared/components/TableContainer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { formatNumber, formatPercent } from '@/shared/utils';

interface CategoryDetailsTableProps {
  details: any[];
  catColor: string;
  CatIcon: LucideIcon;
  catConfig: {
    name: string;
    id: string;
  };
  loading: boolean;
}

export function CategoryDetailsTable({
  details,
  catColor,
  CatIcon,
  catConfig,
  loading,
}: CategoryDetailsTableProps) {
  const getStatusBadge = (ev: string | null, result: any) => {
    if (result == null)
      return (
        <Badge variant="outline" className="text-gray-500 border-gray-300">
          Pending
        </Badge>
      );
    if (ev === 'O')
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Achieved</Badge>;
    if (ev === 'X') return <Badge className="bg-red-100 text-red-700 border-red-200">Missed</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Partial</Badge>;
  };

  return (
    <TableContainer
      icon={CatIcon}
      title={`${catConfig.name} Measurements`}
      totalCount={details.length}
      countUnit="measurement"
      theme="blue"
      loading={loading}
      loadingRows={8}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader
            className="sticky top-0 z-10"
            style={{ background: `linear-gradient(to right, ${catColor}10, ${catColor}18)` }}>
            <TableRow className="border-b border-gray-300">
              <TableHead
                className="w-12 text-left py-2"
                style={{ backgroundColor: `${catColor}08` }}>
                #
              </TableHead>
              <TableHead
                className="min-w-[150px] py-2"
                style={{ backgroundColor: `${catColor}08` }}>
                Department
              </TableHead>
              <TableHead
                className="min-w-[200px] py-2"
                style={{ backgroundColor: `${catColor}08` }}>
                Measurement
              </TableHead>
              <TableHead
                className="min-w-[120px] py-2"
                style={{ backgroundColor: `${catColor}08` }}>
                Subcategory
              </TableHead>
              <TableHead className="min-w-[80px] py-2" style={{ backgroundColor: `${catColor}08` }}>
                Unit
              </TableHead>
              <TableHead
                className="text-right min-w-[100px] py-2"
                style={{ backgroundColor: `${catColor}08` }}>
                Target
              </TableHead>
              <TableHead
                className="text-right min-w-[100px] py-2"
                style={{ backgroundColor: `${catColor}08` }}>
                Result
              </TableHead>
              <TableHead
                className="text-right min-w-[100px] py-2"
                style={{ backgroundColor: `${catColor}08` }}>
                Rate
              </TableHead>
              <TableHead
                className="text-center min-w-[90px] py-2"
                style={{ backgroundColor: `${catColor}08` }}>
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {details.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                  No measurements found for this period
                </TableCell>
              </TableRow>
            ) : (
              details.map((row: any, idx: number) => {
                const rate = row.target > 0 ? ((row.result ?? 0) / row.target) * 100 : 0;
                return (
                  <TableRow
                    key={`${row.department_id}-${row.measurement}-${idx}`}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <TableCell className="text-xs text-gray-400 py-3 pl-6">{idx + 1}</TableCell>
                    <TableCell className="font-medium py-3 text-sm">
                      {row.department_name || row.department_id}
                    </TableCell>
                    <TableCell className="py-3 text-sm">
                      <div className="font-medium">{row.measurement || '-'}</div>
                    </TableCell>
                    <TableCell className="py-3 text-sm">
                      <div className="text-sm text-gray-600">{row.sub_category_name || '-'}</div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">{row.unit || '-'}</TableCell>
                    <TableCell className="text-right py-3 font-mono text-sm">
                      {formatNumber(row.target, 2)}
                    </TableCell>
                    <TableCell
                      className="text-right py-3 font-mono text-sm font-semibold"
                      style={{ color: catColor }}>
                      {formatNumber(row.result, 2)}
                    </TableCell>
                    <TableCell className="text-right py-3 text-sm">
                      <span
                        className={`font-mono font-medium ${rate >= 95 ? 'text-green-600' : rate >= 75 ? 'text-blue-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {row.target > 0 ? formatPercent(rate) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-3">
                      {getStatusBadge(row.ev, row.result)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
