# Tasks: Dashboard Financial Chart Fix

## 1. Modify Dashboard.tsx Layout

### 1.1 Import FinancialSummary Component
- [ ] Add import statement for FinancialSummary component
- [ ] Verify import path is correct

**Details:**
```typescript
import { FinancialSummary } from '../components/dashboard/FinancialSummary';
```

### 1.2 Update ADMIN_BENDAHARA Dashboard Layout
- [ ] Remove FinancialSummary from 2-column grid
- [ ] Add FinancialSummary as full-width component after FinancialSummaryCards
- [ ] Update grid to show ProjectsOverview and RecentActivityList side by side

**Details:**
```typescript
// ADMIN_BENDAHARA dashboard
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
```

### 1.3 Update ADMIN_RT Dashboard Layout
- [ ] Remove FinancialSummary from 2-column grid
- [ ] Add FinancialSummary as full-width component after FinancialSummaryCards
- [ ] Update grid to show ProjectsOverview and RecentActivityList side by side

**Details:**
Same structure as ADMIN_BENDAHARA.

### 1.4 Update SUPER_ADMIN Dashboard Layout
- [ ] Add FinancialSummary component after FinancialSummaryCards
- [ ] Update grid layout to be consistent with other admin roles

**Details:**
```typescript
// SUPER_ADMIN dashboard
return (
  <div className="space-y-6">
    {/* Stats Grid */}
    {stats && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ... stat cards ... */}
      </div>
    )}

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
```

### 1.5 Update ADMIN_SEKRETARIS Dashboard Layout
- [ ] Add FinancialSummary component after FinancialSummaryCards (if hasFinancialAccess)
- [ ] Maintain read-only notice

**Details:**
```typescript
// ADMIN_SEKRETARIS dashboard
return (
  <div className="space-y-6">
    {/* Stats Grid */}
    {stats && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ... stat cards ... */}
      </div>
    )}

    {/* Basic financial summary */}
    {hasFinancialAccess && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Ringkasan Keuangan
        </h3>
        <FinancialSummaryCards />
      </div>
    )}

    {/* Financial Summary Chart - Full Width */}
    {hasFinancialAccess && <FinancialSummary />}

    {/* Quick actions & Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <QuickActions />
      <RecentActivityList activities={activities} isLoading={isLoading} />
    </div>
  </div>
);
```

### 1.6 Verify WARGA Dashboard (No Changes)
- [ ] Confirm FinancialSummary is NOT shown for WARGA role
- [ ] Verify only personal financial info is shown

**Details:**
WARGA should NOT see the RT-wide financial summary chart. No changes needed.

## 2. Testing

### 2.1 Manual Testing - ADMIN_RT
- [ ] Login as ADMIN_RT
- [ ] Navigate to Dashboard
- [ ] Verify FinancialSummary chart appears after FinancialSummaryCards
- [ ] Verify chart shows 12 months of data
- [ ] Verify year selector works
- [ ] Test responsive layout (mobile, tablet, desktop)

### 2.2 Manual Testing - ADMIN_BENDAHARA
- [ ] Login as ADMIN_BENDAHARA
- [ ] Navigate to Dashboard
- [ ] Verify FinancialSummary chart appears
- [ ] Verify chart data is correct
- [ ] Verify hover tooltips work
- [ ] Test year selector

### 2.3 Manual Testing - SUPER_ADMIN
- [ ] Login as SUPER_ADMIN
- [ ] Navigate to Dashboard
- [ ] Verify FinancialSummary chart appears (previously missing)
- [ ] Verify chart shows same data as other admins
- [ ] Test all chart interactions

### 2.4 Manual Testing - ADMIN_SEKRETARIS
- [ ] Login as ADMIN_SEKRETARIS
- [ ] Navigate to Dashboard
- [ ] Verify FinancialSummary chart appears (if has financial read permission)
- [ ] Verify read-only behavior

### 2.5 Manual Testing - WARGA
- [ ] Login as WARGA
- [ ] Navigate to Dashboard
- [ ] Verify FinancialSummary chart does NOT appear
- [ ] Verify only personal financial info is shown

### 2.6 Responsive Testing
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Verify chart is readable at all sizes
- [ ] Verify no horizontal scroll

### 2.7 Dark Mode Testing
- [ ] Toggle dark mode
- [ ] Verify chart colors have good contrast
- [ ] Verify text is readable
- [ ] Verify hover states work in dark mode

### 2.8 Error State Testing
- [ ] Simulate API error (disconnect network)
- [ ] Verify error message appears
- [ ] Verify "Coba Lagi" button works
- [ ] Verify retry fetches data successfully

### 2.9 Loading State Testing
- [ ] Throttle network to slow 3G
- [ ] Verify loading skeleton appears
- [ ] Verify skeleton has animated pulse
- [ ] Verify chart appears after loading

### 2.10 Browser Compatibility Testing
- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest)
- [ ] Test on Edge (latest)

## 3. Documentation

### 3.1 Update Component Documentation
- [ ] Add comment explaining FinancialSummary placement
- [ ] Document role-based visibility logic

**Details:**
```typescript
// Financial Summary Chart - Full Width
// Displayed for all roles with financial access (ADMIN_RT, ADMIN_BENDAHARA, SUPER_ADMIN, ADMIN_SEKRETARIS)
// Shows monthly income vs expense bar chart with year selector
{hasFinancialAccess && <FinancialSummary />}
```

### 3.2 Update README (if needed)
- [ ] Check if Dashboard documentation needs update
- [ ] Add screenshot of new layout (optional)

## 4. Code Review

### 4.1 Self Review
- [ ] Check code formatting (Prettier)
- [ ] Check for console.log statements (remove)
- [ ] Check for TypeScript errors
- [ ] Check for ESLint warnings
- [ ] Verify imports are organized

### 4.2 Peer Review Checklist
- [ ] Code follows project conventions
- [ ] Layout is consistent across roles
- [ ] No duplicate code
- [ ] Responsive design works
- [ ] Dark mode works
- [ ] Performance is acceptable

## 5. Deployment

### 5.1 Pre-deployment
- [ ] Run `pnpm type-check` (no errors)
- [ ] Run `pnpm lint` (no errors)
- [ ] Run `pnpm build` (successful)
- [ ] Test build locally

### 5.2 Deployment
- [ ] Merge PR to main branch
- [ ] Deploy frontend
- [ ] Monitor for errors

### 5.3 Post-deployment Verification
- [ ] Check Dashboard on production for ADMIN_RT
- [ ] Check Dashboard on production for ADMIN_BENDAHARA
- [ ] Check Dashboard on production for SUPER_ADMIN
- [ ] Verify chart loads correctly
- [ ] Verify no console errors

## 6. Rollback Plan (if needed)

### 6.1 Identify Issues
- [ ] Document any issues found
- [ ] Determine if rollback is necessary

### 6.2 Execute Rollback
- [ ] Revert commit: `git revert <commit-hash>`
- [ ] Deploy reverted version
- [ ] Verify Dashboard works with old layout

### 6.3 Post-rollback
- [ ] Analyze root cause
- [ ] Fix issues
- [ ] Re-test before re-deploying

## Task Summary

**Total Tasks:** 6 main tasks
- Task 1: Modify Dashboard.tsx Layout (6 subtasks)
- Task 2: Testing (10 subtasks)
- Task 3: Documentation (2 subtasks)
- Task 4: Code Review (2 subtasks)
- Task 5: Deployment (3 subtasks)
- Task 6: Rollback Plan (3 subtasks)

**Estimated Time:**
- Implementation: 1 hour
- Testing: 30 minutes
- Documentation: 15 minutes
- Review: 15 minutes
- Total: 2 hours

**Priority:** High (user-facing bug fix)

**Dependencies:**
- None (all components already exist)

**Risks:**
- Low (simple layout change, no logic changes)
