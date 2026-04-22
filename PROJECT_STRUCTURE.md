# KPI Auto Report - Project Structure

This document outlines the standardized project structure following Vite + TypeScript best practices.

## Directory Structure

```
kpi-auto-report/
.
README.md
package.json
pnpm-lock.yaml
tsconfig.json
vite.config.ts
tailwind.config.ts
postcss.config.ts
components.json
.env
.env.development
.gitignore

# Source Code (src/)
src/
# Main application files
App.tsx
main.tsx
styles.css
vite-env.d.ts

# Assets
src/assets/
  index.ts          # Asset exports and constants
  images/           # Image files
  fonts/            # Font files
  icons/            # Icon files

# Components
src/components/
  index.ts          # Main component barrel exports
  ui/               # Reusable UI components (shadcn/ui)
    index.ts
    button.tsx
    dialog.tsx
    ...
  shared/           # Shared components across pages
    index.ts
    StandardPageLayout.tsx
  admin/            # Admin-specific components
    index.ts
    AdminList.tsx
    AdminListItem.tsx
  features/         # Feature-specific components
    index.ts
    Breadcrumb.tsx
    ContactWidget.tsx
    ...
  forms/            # Form components
    index.ts
    categoryForm.tsx
    loginForm.tsx
  kpi/              # KPI-specific components
    index.ts
    AddTargetModal.tsx
    AttachmentPanel.tsx
    ...
  layout/           # Layout components
    index.ts
    appSidebar.tsx
    nav-user.tsx

# Pages
src/pages/
  index.ts          # Page barrel exports
  admin/            # Admin pages
    index.ts
    UsersPage.tsx
    KPICategoriesPage.tsx
    components/
      index.ts
      AdminUsersList.tsx
      AdminUsersEditDialog.tsx
      KPIAddDialog.tsx
      KPIOverview.tsx
    hooks/
      index.ts
      useKPIData.tsx
  dashboard/        # Dashboard pages
    index.ts
    MainDashboard.tsx
  kpi/              # KPI pages
    index.ts
    YearlyTargetsPage.tsx
    MonthlyTargetsPage.tsx
    MonthlyResultPage.tsx
    overview/
      index.ts
      types.ts

# Hooks
src/hooks/
  index.ts
  use-toast.ts
  use-infinity-scroll.ts

# Contexts
src/contexts/
  index.ts
  AuthContext.tsx
  FiscalYearContext.tsx
  LoadingContext.tsx

# Services
src/services/
  api-service.ts
  department-service.ts
  kpi-forms-service.ts
  kpi-service.ts

# Shared utilities and types
src/shared/
  constants/
    index.ts
  types/
    index.ts
    kpi.ts
  utils/
    index.ts
    image.ts
    session-manager.ts
    sidebar.ts
    storage.ts

# Configuration
src/config/
  api.ts

# Constants
src/constants/
  breakpoints.ts

# Library utilities
src/lib/
  utils.ts

# Type definitions
src/types/
  index.ts          # Central type exports

# Server-side code
server/
  api.ts            # Main API entry point
  index.ts          # Server entry point
  tsconfig.json     # Server TypeScript config
  config/
    app-config.ts
    database.ts
  middleware/
    auth.ts
    request-logger.ts
    security.ts
  models/           # Database models
  routes/           # API routes
    admin-categories.ts
    admin-users.ts
    auth.ts
    ...
  scripts/          # Database scripts
    reset-kpi-db.ts
    seed-admin-users.ts
    ...

# Public assets
public/
  contact/
  flags/
  Avatar.png
  DENSO_LOGO.png
  favicon.ico
  ...

# Documentation
doc/
  FY25 Company KPI Monthly report.xlsx
  Department KPI&Action plan -Blank Format.xlsx
  ...

# Configuration files
config/
nginx.conf
ecosystem.config.cjs
```

## Key Improvements Made

### 1. TypeScript Configuration
- **Main tsconfig.json**: Updated with proper path aliases and Vite-compatible settings
- **Server tsconfig.json**: Separated configuration for backend code
- **Path aliases**: Comprehensive alias mapping for better imports

### 2. Folder Organization
- **Standardized structure**: Follows Vite + React best practices
- **Barrel exports**: Index files in each folder for clean imports
- **Separation of concerns**: Clear distinction between UI, business logic, and shared code

### 3. Import Path Standards
```typescript
// Components
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/shared';

// Pages
import { AdminUsersPage } from '@/pages/admin';

// Hooks
import { useToast } from '@/hooks/use-toast';

// Services
import { kpiService } from '@/services/kpi-service';

// Types
import type { User, KPIItem } from '@/types';

// Utils
import { cn } from '@/lib/utils';
```

### 4. Type Safety
- **Centralized types**: All types exported from `src/types/index.ts`
- **Interface consistency**: Proper typing for all components and APIs
- **Optional chaining**: Fixed undefined access issues

### 5. Component Exports
- **Named exports**: Consistent use of named exports for better tree-shaking
- **Default exports**: Used appropriately for main components
- **Index files**: Clean barrel exports for all modules

## Development Guidelines

### File Naming
- **Components**: PascalCase (e.g., `StandardPageLayout.tsx`)
- **Utilities**: camelCase (e.g., `api-service.ts`)
- **Types**: camelCase with descriptive names (e.g., `user-types.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

### Import Order
1. React and external libraries
2. Internal components (using @/ aliases)
3. Services and utilities
4. Types and interfaces
5. Local imports

### Export Patterns
```typescript
// For components with multiple exports
export { Component1, Component2 } from './ComponentFile';
export { default as Component3 } from './Component3';

// For single main export
export { default as MainComponent } from './MainComponent';
```

## Build and Development

### Development Commands
```bash
pnpm dev              # Start both frontend and API
pnpm dev:frontend     # Frontend only
pnpm dev:api          # API only
```

### Build Commands
```bash
pnpm build            # Build both frontend and API
pnpm build:frontend   # Frontend only
pnpm build:server     # API only
```

### Type Checking
```bash
npx tsc --noEmit      # Type check without compilation
```

## Benefits of This Structure

1. **Maintainability**: Clear organization makes code easy to find and modify
2. **Scalability**: Structure supports growth without becoming messy
3. **Type Safety**: Comprehensive TypeScript configuration catches errors early
4. **Developer Experience**: Fast imports with path aliases and clear naming
5. **Build Performance**: Optimized for Vite's build system
6. **Code Splitting**: Natural separation enables better chunking

## Migration Notes

This structure addresses the following issues that were present:
- Inconsistent file extensions (.ts vs .tsx)
- Mixed folder organization
- Missing proper index files
- TypeScript path inconsistencies
- Improper component organization
- Syntax errors and type issues

All issues have been resolved and the project now follows modern React + TypeScript best practices.
