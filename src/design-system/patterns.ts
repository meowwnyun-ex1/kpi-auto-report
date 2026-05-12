/**
 * Component Patterns
 * Reusable UI patterns and configurations
 */

export const patterns = {
  button: {
    sizes: {
      xs: { height: '1.5rem', padding: '0 0.5rem', fontSize: '0.75rem' },
      sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.875rem' },
      md: { height: '2.5rem', padding: '0 1rem', fontSize: '0.875rem' },
      lg: { height: '3rem', padding: '0 1.5rem', fontSize: '1rem' },
    },
  },
  card: {
    base: 'bg-white rounded-lg border border-gray-200 shadow-sm',
    hover: 'hover:shadow-md transition-shadow duration-200',
    padding: { sm: 'p-3', md: 'p-4', lg: 'p-6' },
  },
  form: {
    input: {
      base: 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    },
    label: 'block text-sm font-medium text-gray-700 mb-1',
    error: 'mt-1 text-sm text-red-600',
  },
  table: {
    base: 'min-w-full divide-y divide-gray-200',
    header: 'bg-gray-50',
    headerCell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
    row: 'hover:bg-gray-50 transition-colors',
    cell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
  },
} as const;

export const layout = {
  grid: { columns: 12, gutter: '1rem' },
  sidebar: { width: '16rem', collapsedWidth: '4rem' },
  header: { height: '4rem' },
  footer: { height: '3rem' },
} as const;
