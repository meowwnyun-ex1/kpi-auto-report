import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import MainDashboard from './MainDashboard';

interface CategoryDashboardProps {
  category?: string;
}

const KPI_CATEGORIES = [
  'safety',
  'quality',
  'delivery',
  'compliance',
  'hr',
  'attractive',
  'environment',
  'cost',
];

export function CategoryDashboard({ category: propCategory }: CategoryDashboardProps) {
  const params = useParams();
  const category = propCategory || params.category;

  // Validate category
  if (!category || !KPI_CATEGORIES.includes(category)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render MainDashboard with category filter
  return <MainDashboard initialCategory={category} />;
}

export default CategoryDashboard;
