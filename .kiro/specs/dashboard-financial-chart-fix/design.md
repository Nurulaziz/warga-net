# Design: Dashboard Financial Chart Fix

## 1. Architecture Overview

### Problem Analysis
Komponen `FinancialSummary` yang berisi bar chart sudah ada dan berfungsi dengan baik, tetapi tidak ditampilkan di `Dashboard.tsx`. Masalahnya adalah:

1. Di `Dashboard.tsx`, komponen `FinancialSummary` hanya ditampilkan untuk ADMIN_BENDAHARA dan ADMIN_RT dalam grid 2 kolom bersama `ProjectsOverview`
2. Untuk role lain (SUPER_ADMIN), komponen tidak ditampilkan sama sekali
3. Layout grid 2 kolom membuat chart terlalu sempit di beberapa screen size

### Solution Approach
Menampilkan komponen `FinancialSummary` secara konsisten untuk semua role yang memiliki akses financial, dengan layout yang lebih baik.

## 2. Component Structure

### Current Structure
```
Dashboard.tsx
├── Header
├── Stats Grid (role-based)
├── FinancialSummaryCards (if hasFinancialAccess)
└── Role-based content:
    ├── ADMIN_BENDAHARA:
    │   ├── Grid 2 columns:
    │   │   ├── FinancialSummary (col 1)
    │   │   └── ProjectsOverview (col 2)
    │   └── QuickActions + RecentActivity
    ├── ADMIN_RT:
    │   ├── Grid 2 columns:
    │   │   ├── FinancialSummary (col 1)
    │   │   └── ProjectsOverview (col 2)
    │   └── QuickActions + RecentActivity
    └── SUPER_ADMIN:
        ├── FinancialSummaryCards
        ├── Grid 2 columns:
        │   ├── (empty - no FinancialSummary!)
        │   └── ProjectsOverview
        └── QuickActions + RecentActivity
```

### Proposed Structure
```
Dashboard.tsx
├── Header
├── Stats Grid (role-based)
├── FinancialSummaryCards (if hasFinancialAccess)
├── FinancialSummary (full width, if hasFinancialAccess) ← FIX
└── Role-based content:
    ├── Grid 2 columns:
    │   ├── ProjectsOverview
    │   └── RecentActivity
    └── QuickActions
```

## 3. Implementation Plan

### 3.1 Modify Dashboard.tsx

**Location:** `apps/frontend/src/routes/Dashboard.tsx`

**Changes:**
1. Import `FinancialSummary` component
2. Add `FinancialSummary` after `FinancialSummaryCards` for all roles with financial access
3. Remove `FinancialSummary` from role-specific grid layouts
4. Simplify grid layouts to show `ProjectsOverview` and `RecentActivity` side by side

**Code Changes:**

```typescript
// Import FinancialSummary
import { FinancialSummary } from '../components/dashboard/FinancialSummary';

// In renderDashboardContent(), for ADMIN_BENDAHARA:
return (
  <div className="space-y-6">
    {/* Financial Summary Cards */}
    {hasFinancialAccess && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Ringkasan Keuangan RT
        </h3>
        <FinancialSummaryCards />
      </div>
    )}

    {/* Financial Summary Chart - Full Width */}
    {hasFinancialAccess && <FinancialSummary />}
    
    {/* Projects & Activity Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ProjectsOverview />
      <RecentActivityList activities={activities} isLoading={isLoading} />
    </div>
    
    <QuickActions />
  </div>
);

// Similar changes for ADMIN_RT and SUPER_ADMIN
```

### 3.2 Verify FinancialSummary Component

**Location:** `apps/frontend/src/components/dashboard/FinancialSummary.tsx`

**Current Implementation:**
- ✅ Fetches data from `/api/v1/dashboard/financial-summary`
- ✅ Has loading skeleton
- ✅ Has error state with retry
- ✅ Has year selector
- ✅ Displays bar chart with income/expense
- ✅ Shows legend with totals
- ✅ Shows balance summary
- ✅ Responsive design

**No changes needed** - component is already well-implemented.

### 3.3 Verify Backend Endpoint

**Location:** `apps/backend/src/dashboard/dashboard.service.ts`

**Current Implementation:**
- ✅ Endpoint: `GET /api/v1/dashboard/financial-summary?year=2025`
- ✅ Returns: `{ year, monthlyData[], totalIncome, totalExpense, balance, timestamp }`
- ✅ Caches data in Redis (TTL: 5 minutes)
- ✅ Aggregates payments and expenses by month

**No changes needed** - backend is already correct.

## 4. Data Flow

```
User opens Dashboard
    ↓
Dashboard.tsx renders
    ↓
Check hasFinancialAccess
    ↓ (true)
Render FinancialSummary component
    ↓
FinancialSummary.useEffect()
    ↓
dashboardService.getFinancialSummary(year)
    ↓
GET /api/v1/dashboard/financial-summary?year=2025
    ↓
DashboardService.getFinancialSummary()
    ↓
Check Redis cache
    ↓ (miss)
Query Prisma (payments + expenses)
    ↓
Aggregate by month
    ↓
Cache in Redis (TTL: 5min)
    ↓
Return data to frontend
    ↓
FinancialSummary renders bar chart
```

## 5. UI/UX Design

### Layout Hierarchy

```
Dashboard
├── Header (Dashboard title + role description)
├── Stats Grid (4 cards for SUPER_ADMIN/ADMIN_RT, 3 for others)
├── Financial Summary Section
│   ├── Section Title: "Ringkasan Keuangan RT"
│   ├── FinancialSummaryCards (3 cards: Pemasukan, Pengeluaran, Saldo)
│   └── FinancialSummary (Bar Chart - FULL WIDTH)
│       ├── Header (title + year selector)
│       ├── Legend (Total Pemasukan, Total Pengeluaran)
│       ├── Bar Chart (12 months, side-by-side bars)
│       └── Summary (Saldo)
└── Other Sections (Projects, Activity, Quick Actions)
```

### Responsive Breakpoints

**Mobile (< 768px):**
- FinancialSummary: Full width
- Bar chart: Smaller bars, scrollable if needed
- Year selector: Full width button

**Tablet (768px - 1024px):**
- FinancialSummary: Full width
- Bar chart: Medium bars
- Year selector: Inline with title

**Desktop (> 1024px):**
- FinancialSummary: Full width (max-width container)
- Bar chart: Full bars with good spacing
- Year selector: Inline with title

### Color Scheme

**Income (Pemasukan):**
- Color: `bg-primary-500` (blue)
- Hover: `bg-primary-600`
- Dark mode: Same colors (already has good contrast)

**Expense (Pengeluaran):**
- Color: `bg-red-500`
- Hover: `bg-red-600`
- Dark mode: Same colors

**Balance (Saldo):**
- Positive: `text-green-600 dark:text-green-400`
- Negative: `text-red-600 dark:text-red-400`

## 6. Permission Logic

### hasFinancialAccess Check

```typescript
const hasFinancialAccess = 
  hasPermission('financial_reports', 'read') || 
  hasPermission('payments', 'read') || 
  hasPermission('expenses', 'read') ||
  hasPermission('bills', 'read');
```

### Role-based Access

| Role | hasFinancialAccess | Show Chart |
|------|-------------------|------------|
| SUPER_ADMIN | ✅ Yes | ✅ Yes |
| ADMIN_RT | ✅ Yes | ✅ Yes |
| ADMIN_BENDAHARA | ✅ Yes | ✅ Yes |
| ADMIN_SEKRETARIS | ✅ Yes (read-only) | ✅ Yes |
| WARGA | ❌ No (personal only) | ❌ No |

## 7. Error Handling

### Error States

1. **Network Error:**
   - Display: "Gagal memuat ringkasan keuangan"
   - Action: "Coba Lagi" button
   - Retry: Call `loadData()` again

2. **No Data:**
   - Display: Empty chart with message
   - Message: "Belum ada data keuangan untuk tahun ini"

3. **Permission Denied:**
   - Don't render component at all
   - Check `hasFinancialAccess` before rendering

### Loading States

1. **Initial Load:**
   - Show skeleton with animated pulse
   - Skeleton includes: title, legend, chart area

2. **Year Change:**
   - Show loading spinner on year selector
   - Keep previous chart visible (optional)

## 8. Performance Considerations

### Optimization Strategies

1. **Backend Caching:**
   - Redis cache with 5-minute TTL
   - Reduces database queries

2. **Frontend Caching:**
   - React state caches data per year
   - No re-fetch on component re-render

3. **Lazy Loading:**
   - Component already uses `useEffect` for data fetching
   - No blocking on initial page load

4. **Chart Rendering:**
   - Pure CSS for bars (no canvas/SVG overhead)
   - Smooth transitions with CSS

### Performance Metrics

- Initial load: < 2 seconds
- Year change: < 1 second (cached) or < 2 seconds (uncached)
- Chart render: < 100ms
- Resize: Smooth (CSS transitions)

## 9. Testing Strategy

### Unit Tests
- Not required (simple layout change)

### Integration Tests
- Not required (no new logic)

### Manual Testing

**Test Cases:**

1. **ADMIN_RT Dashboard:**
   - ✅ Chart appears after FinancialSummaryCards
   - ✅ Chart shows 12 months of data
   - ✅ Year selector works
   - ✅ Chart is responsive

2. **ADMIN_BENDAHARA Dashboard:**
   - ✅ Chart appears after FinancialSummaryCards
   - ✅ Chart shows correct data
   - ✅ Hover tooltips work

3. **SUPER_ADMIN Dashboard:**
   - ✅ Chart appears (previously missing)
   - ✅ Chart shows same data as other admins

4. **ADMIN_SEKRETARIS Dashboard:**
   - ✅ Chart appears (read-only)
   - ✅ No edit actions available

5. **WARGA Dashboard:**
   - ✅ Chart does NOT appear
   - ✅ Only personal financial info shown

### Browser Testing
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Device Testing
- Mobile (iPhone, Android)
- Tablet (iPad)
- Desktop (various screen sizes)

## 10. Rollback Plan

### If Issues Occur

1. **Revert Dashboard.tsx changes:**
   - Remove `<FinancialSummary />` from common section
   - Restore role-specific layouts

2. **No database changes needed** (no schema changes)

3. **No backend changes needed** (endpoint already exists)

### Rollback Command
```bash
git revert <commit-hash>
```

## 11. Deployment Notes

### Pre-deployment Checklist
- ✅ Code review completed
- ✅ Manual testing on all roles
- ✅ Responsive testing on mobile/tablet/desktop
- ✅ Dark mode testing
- ✅ Performance testing (load time < 2s)

### Deployment Steps
1. Merge PR to main branch
2. Deploy frontend (no backend changes needed)
3. Clear browser cache (if needed)
4. Verify on production

### Post-deployment Verification
- Check Dashboard for ADMIN_RT
- Check Dashboard for ADMIN_BENDAHARA
- Check Dashboard for SUPER_ADMIN
- Verify chart loads correctly
- Verify year selector works

## 12. Future Enhancements (Out of Scope)

- Add more chart types (line chart, pie chart)
- Add drill-down to transaction details
- Add export chart as image
- Add real-time updates
- Add chart animations
- Add comparison with previous year
- Add budget vs actual comparison

## 13. Correctness Properties

### Property 1: Chart Visibility
**Property:** Chart MUST be visible for all roles with `hasFinancialAccess = true`

**Test:**
```typescript
// For each role with financial access
if (hasFinancialAccess) {
  expect(screen.getByText('Ringkasan Keuangan')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /bar chart/i })).toBeInTheDocument();
}
```

### Property 2: Data Accuracy
**Property:** Chart data MUST match backend response

**Test:**
```typescript
// Mock API response
const mockData = {
  year: 2025,
  monthlyData: [
    { month: 'Jan', income: 1000000, expense: 500000 },
    // ... 11 more months
  ],
  totalIncome: 12000000,
  totalExpense: 6000000,
  balance: 6000000,
};

// Verify chart displays correct totals
expect(screen.getByText('Rp 12.0jt')).toBeInTheDocument(); // Total Income
expect(screen.getByText('Rp 6.0jt')).toBeInTheDocument(); // Total Expense
expect(screen.getByText('Rp 6.0jt')).toBeInTheDocument(); // Balance
```

### Property 3: Responsive Layout
**Property:** Chart MUST be responsive at all breakpoints

**Test:**
```typescript
// Test at different viewport sizes
const viewports = [
  { width: 375, height: 667 },  // Mobile
  { width: 768, height: 1024 }, // Tablet
  { width: 1920, height: 1080 }, // Desktop
];

for (const viewport of viewports) {
  cy.viewport(viewport.width, viewport.height);
  cy.get('[data-testid="financial-summary"]').should('be.visible');
  cy.get('[data-testid="bar-chart"]').should('be.visible');
}
```

### Property 4: Error Handling
**Property:** Chart MUST show error state when API fails

**Test:**
```typescript
// Mock API error
server.use(
  rest.get('/api/v1/dashboard/financial-summary', (req, res, ctx) => {
    return res(ctx.status(500));
  })
);

// Verify error state
expect(screen.getByText('Gagal memuat ringkasan keuangan')).toBeInTheDocument();
expect(screen.getByRole('button', { name: /coba lagi/i })).toBeInTheDocument();
```

### Property 5: Loading State
**Property:** Chart MUST show loading state while fetching data

**Test:**
```typescript
// Delay API response
server.use(
  rest.get('/api/v1/dashboard/financial-summary', async (req, res, ctx) => {
    await delay(1000);
    return res(ctx.json(mockData));
  })
);

// Verify loading state
expect(screen.getByTestId('financial-summary-skeleton')).toBeInTheDocument();

// Wait for data to load
await waitFor(() => {
  expect(screen.queryByTestId('financial-summary-skeleton')).not.toBeInTheDocument();
});
```

## 14. Summary

### Changes Required
1. Modify `Dashboard.tsx` to show `FinancialSummary` for all roles with financial access
2. Move `FinancialSummary` from role-specific grids to common section (full width)
3. Simplify grid layouts

### Files to Modify
- `apps/frontend/src/routes/Dashboard.tsx` (main change)

### Files to Verify (no changes)
- `apps/frontend/src/components/dashboard/FinancialSummary.tsx`
- `apps/backend/src/dashboard/dashboard.service.ts`

### Estimated Effort
- Implementation: 1 hour
- Testing: 30 minutes
- Total: 1.5 hours
