# Implementation Plan: Dashboard Statistics API

## Overview

Implementasi backend endpoints untuk dashboard statistics dengan Redis caching, database aggregation queries, dan frontend integration. Tasks ini mengikuti incremental approach dengan testing di setiap step.

## Tasks

- [x] 1. Setup Dashboard Module dan DTOs
  - Create dashboard module dengan controller, service, dan DTOs
  - Define OverallStatsDto, FinancialSummaryDto, MonthlyDataDto, ActivitySummaryDto, DailyTransactionDto
  - Setup module dependencies (PrismaService, RedisService, Logger)
  - _Requirements: 1.1-1.7, 2.1-2.8, 3.1-3.6_

- [x] 2. Implement Overall Stats Endpoint
  - [x] 2.1 Create computeOverallStats method dengan database aggregation
    - Query active residents count (isActive=true, deletedAt=null)
    - Query total families count (deletedAt=null)
    - Query active fee types count (isActive=true, deletedAt=null)
    - Query current month bills untuk totalFeesAmount, pendingBillsCount, paidBillsCount
    - Use Promise.all untuk parallel queries
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 2.2 Implement caching layer dengan getCachedOrCompute helper
    - Check Redis cache first dengan key 'dashboard:stats:overall'
    - If cache miss, compute from database
    - Store result in Redis dengan TTL 300 seconds
    - Handle Redis connection failures gracefully
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.3 Create GET /api/v1/dashboard/stats controller endpoint
    - Apply JwtAuthGuard untuk authentication
    - Call dashboardService.getOverallStats()
    - Return OverallStatsDto dengan timestamp
    - _Requirements: 5.1, 12.1_

  - [ ]* 2.4 Write property test for overall stats response structure
    - **Property 1: Overall Stats Response Structure**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

  - [ ]* 2.5 Write property test for overall stats data accuracy
    - **Property 2: Overall Stats Data Accuracy**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [ ]* 2.6 Write property test for current month bills aggregation
    - **Property 3: Current Month Bills Aggregation**
    - **Validates: Requirements 1.4, 1.5, 1.6**

  - [ ]* 2.7 Write unit tests untuk overall stats endpoint
    - Test authenticated request returns stats
    - Test unauthenticated request returns 401
    - Test cache hit scenario
    - Test cache miss scenario
    - Test database failure with cache fallback
    - _Requirements: 5.1, 10.1, 10.2_

- [x] 3. Checkpoint - Test overall stats endpoint
  - Ensure all tests pass, verify endpoint returns correct data

- [x] 4. Implement Financial Summary Endpoint
  - [x] 4.1 Create computeFinancialSummary method dengan monthly aggregation
    - Query payments grouped by month untuk income
    - Query expenses grouped by month untuk expense
    - Generate 12 months data dengan month abbreviations (Jan-Dec)
    - Calculate totalIncome, totalExpense, balance
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 2.7, 2.8_

  - [x] 4.2 Implement year parameter handling
    - Default to current year if not provided
    - Validate year range (2020-2100)
    - Filter queries by year range
    - _Requirements: 2.3, 2.4_

  - [x] 4.3 Add caching dengan year-specific keys
    - Cache key: 'dashboard:financial:{year}'
    - TTL: 300 seconds
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.4 Create GET /api/v1/dashboard/financial-summary controller endpoint
    - Apply JwtAuthGuard dan PermissionsGuard
    - Require 'financial:view' permission
    - Handle year query parameter
    - Filter data untuk WARGA role (only own data)
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [ ]* 4.5 Write property test for financial summary structure
    - **Property 4: Financial Summary Structure**
    - **Validates: Requirements 2.1, 2.2, 2.7, 2.8**

  - [ ]* 4.6 Write property test for year parameter handling
    - **Property 5: Financial Summary Year Parameter**
    - **Validates: Requirements 2.3, 2.4**

  - [ ]* 4.7 Write property test for financial aggregation accuracy
    - **Property 6: Financial Aggregation Accuracy**
    - **Validates: Requirements 2.5, 2.6**

  - [ ]* 4.8 Write property test for balance calculation
    - **Property 7: Balance Calculation**
    - **Validates: Requirements 2.8**

  - [ ]* 4.9 Write unit tests untuk financial summary endpoint
    - Test admin user can access all data
    - Test WARGA user gets filtered data
    - Test user without permission gets 403
    - Test year parameter validation
    - Test 12 months data structure
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 5. Checkpoint - Test financial summary endpoint
  - Ensure all tests pass, verify permission checks work correctly

- [x] 6. Implement Activity Summary Endpoint
  - [x] 6.1 Create computeActivitySummary method dengan period calculation
    - Calculate date range based on period (weekly/monthly)
    - Count transactions (payments + expenses) in period
    - Sum total fees collected (non-voided payments)
    - Calculate trend percentage vs previous period
    - Generate last 7 days daily transaction data
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.2 Implement period parameter handling
    - Support 'weekly' dan 'monthly' periods
    - Default to 'weekly' if not provided
    - Calculate correct date ranges untuk each period
    - _Requirements: 3.6_

  - [x] 6.3 Add caching dengan period-specific keys
    - Cache key: 'dashboard:activity:{period}'
    - TTL: 300 seconds
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.4 Create GET /api/v1/dashboard/activity-summary controller endpoint
    - Apply JwtAuthGuard
    - Handle period query parameter
    - Return ActivitySummaryDto dengan dailyTransactions
    - _Requirements: 5.1, 12.1_

  - [ ]* 6.5 Write property test for transaction counting
    - **Property 8: Activity Summary Transaction Counting**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 6.6 Write property test for fees collected calculation
    - **Property 9: Activity Summary Fees Collected**
    - **Validates: Requirements 3.3**

  - [ ]* 6.7 Write property test for trend percentage calculation
    - **Property 10: Trend Percentage Calculation**
    - **Validates: Requirements 3.4**

  - [ ]* 6.8 Write property test for daily transaction data structure
    - **Property 11: Daily Transaction Data Structure**
    - **Validates: Requirements 3.5**

  - [ ]* 6.9 Write property test for period parameter handling
    - **Property 12: Period Parameter Handling**
    - **Validates: Requirements 3.6**

  - [ ]* 6.10 Write unit tests untuk activity summary endpoint
    - Test weekly period calculation
    - Test monthly period calculation
    - Test trend percentage with zero division
    - Test daily transactions array length
    - _Requirements: 3.1-3.6_

- [x] 7. Checkpoint - Test activity summary endpoint
  - Ensure all tests pass, verify trend calculations are correct

- [x] 8. Implement Cache Invalidation
  - [x] 8.1 Create invalidateCache method dengan pattern matching
    - Use Redis KEYS command untuk find matching keys
    - Delete all matching keys dengan MDEL
    - Log invalidation events
    - _Requirements: 4.5_

  - [x] 8.2 Add cache invalidation hooks in PaymentsService
    - Invalidate 'dashboard:stats:*' on payment creation
    - Invalidate 'dashboard:financial:*' on payment creation
    - Invalidate 'dashboard:activity:*' on payment creation
    - _Requirements: 4.5_

  - [x] 8.3 Add cache invalidation hooks in ExpensesService
    - Invalidate 'dashboard:financial:*' on expense creation
    - Invalidate 'dashboard:activity:*' on expense creation
    - _Requirements: 4.5_

  - [x] 8.4 Add cache invalidation hooks in BillsService
    - Invalidate 'dashboard:stats:*' on bill status update
    - _Requirements: 4.5_

  - [x] 8.5 Create POST /api/v1/dashboard/refresh endpoint
    - Invalidate all dashboard cache entries
    - Return success message
    - _Requirements: 4.5_

  - [ ]* 8.6 Write property test for cache storage with TTL
    - **Property 13: Cache Storage with TTL**
    - **Validates: Requirements 4.1**

  - [ ]* 8.7 Write property test for cache-first strategy
    - **Property 14: Cache-First Strategy**
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [ ]* 8.8 Write property test for cache invalidation on data modification
    - **Property 15: Cache Invalidation on Data Modification**
    - **Validates: Requirements 4.5**

  - [ ]* 8.9 Write integration tests untuk cache invalidation
    - Test payment creation invalidates cache
    - Test expense creation invalidates cache
    - Test bill update invalidates cache
    - Test manual refresh endpoint
    - _Requirements: 4.5_

- [x] 9. Checkpoint - Test cache invalidation
  - Ensure cache is properly invalidated on data changes

- [x] 10. Implement Permission-Based Access Control
  - [ ]* 10.1 Write property test for admin role financial access
    - **Property 16: Admin Role Financial Access**
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 10.2 Write property test for warga role data filtering
    - **Property 17: Warga Role Data Filtering**
    - **Validates: Requirements 6.4**

  - [ ]* 10.3 Write property test for unauthorized access rejection
    - **Property 18: Unauthorized Access Rejection**
    - **Validates: Requirements 6.5**

  - [ ]* 10.4 Write integration tests untuk permission checks
    - Test ADMIN_RT can access all financial data
    - Test ADMIN_BENDAHARA can access all financial data
    - Test WARGA can only access own data
    - Test user without permission gets 403
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 11. Implement Error Handling
  - [x] 11.1 Add database failure fallback logic
    - Try cache first on database error
    - Return cached data if available
    - Throw ServiceUnavailableException if both fail
    - _Requirements: 10.1, 10.2_

  - [x] 11.2 Add partial data calculation with error indicators
    - Wrap each stat calculation in try-catch
    - Continue with other calculations on failure
    - Log partial failures
    - Return partial data dengan error indicators
    - _Requirements: 10.3_

  - [x] 11.3 Add Redis connection failure handling
    - Proceed with database query if Redis unavailable
    - Log Redis failures as warnings
    - Don't fail request due to cache issues
    - _Requirements: 10.1_

  - [ ]* 11.4 Write property test for database failure fallback
    - **Property 19: Database Failure Fallback**
    - **Validates: Requirements 10.1, 10.2**

  - [ ]* 11.5 Write property test for partial data on calculation failure
    - **Property 20: Partial Data on Calculation Failure**
    - **Validates: Requirements 10.3**

  - [ ]* 11.6 Write unit tests untuk error scenarios
    - Test database connection failure
    - Test Redis connection failure
    - Test partial calculation failure
    - Test validation errors
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 12. Checkpoint - Test error handling
  - Ensure graceful degradation works correctly

- [x] 13. Frontend Service Layer Integration
  - [x] 13.1 Create dashboard.service.ts dengan TypeScript interfaces
    - Define OverallStats, FinancialSummary, MonthlyData, ActivitySummary, DailyTransaction interfaces
    - Implement getOverallStats() method
    - Implement getFinancialSummary(year?) method
    - Implement getActivitySummary(period?) method
    - Implement refreshCache() method
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 13.2 Export dashboard service dari services/index.ts
    - Add dashboardService to exports
    - _Requirements: 7.1_

- [x] 14. Update StatsGrid Component
  - [x] 14.1 Replace hardcoded data dengan API call
    - Import dashboardService dan OverallStats interface
    - Add useState untuk stats, loading, error
    - Add useEffect untuk load data on mount
    - Implement loadStats async function
    - _Requirements: 8.1, 8.2_

  - [x] 14.2 Add loading state dengan skeleton
    - Show StatsGridSkeleton during loading
    - Use 6 skeleton cards matching grid layout
    - _Requirements: 8.3_

  - [x] 14.3 Add error handling dengan retry button
    - Show error message on failure
    - Add "Coba Lagi" button to retry
    - _Requirements: 8.4_

  - [x] 14.4 Update StatCard rendering dengan real data
    - Map stats.totalResidents to Warga card
    - Map stats.totalFamilies to Keluarga card
    - Map stats.activeFeeTypes to Iuran Aktif card
    - Map stats.totalFeesAmount to Total Iuran card (format as millions)
    - Map stats.pendingBillsCount to Pending card
    - Map stats.paidBillsCount to Lunas card
    - _Requirements: 8.1_

- [x] 15. Update FinancialSummary Component
  - [x] 15.1 Replace hardcoded data dengan API call
    - Import dashboardService dan FinancialSummary interface
    - Add useState untuk data, loading, error, selectedYear
    - Add useEffect untuk load data when year changes
    - Implement loadData async function
    - _Requirements: 9.1, 9.2_

  - [x] 15.2 Add year selector dropdown
    - Add select element dengan years 2023-2025
    - Update selectedYear state on change
    - Trigger data reload on year change
    - _Requirements: 9.3_

  - [x] 15.3 Add loading state dengan skeleton
    - Show FinancialSummarySkeleton during loading
    - _Requirements: 9.4_

  - [x] 15.4 Add error handling dengan retry button
    - Show error message on failure
    - Add "Coba Lagi" button to retry
    - _Requirements: 9.5_

  - [x] 15.5 Update chart rendering dengan real data
    - Map monthlyData to bar chart
    - Calculate bar heights based on maxValue
    - Show totalIncome, totalExpense, balance
    - Add hover tooltips dengan formatted amounts
    - _Requirements: 9.1_

- [x] 16. Update ProjectsOverview Component
  - [x] 16.1 Replace hardcoded data dengan API call
    - Import dashboardService dan ActivitySummary interface
    - Add useState untuk data, loading, error, period
    - Add useEffect untuk load data when period changes
    - Implement loadData async function
    - _Requirements: 11.1, 11.2_

  - [x] 16.2 Add period selector dropdown
    - Add select element dengan 'weekly' dan 'monthly' options
    - Update period state on change
    - Trigger data reload on period change
    - _Requirements: 11.3_

  - [x] 16.3 Add loading state dengan skeleton
    - Show ProjectsOverviewSkeleton during loading
    - _Requirements: 11.4_

  - [x] 16.4 Add error handling dengan retry button
    - Show error message on failure
    - Add "Coba Lagi" button to retry
    - _Requirements: 11.5_

  - [x] 16.5 Update ProjectStat rendering dengan real data
    - Map totalFeesCollected to first stat
    - Map transactionCount to second stat
    - Show trendPercentage dengan + or - prefix
    - Calculate bar heights from dailyTransactions
    - _Requirements: 11.1_

- [ ] 17. Final Integration Testing
  - [ ]* 17.1 Write property test for response timestamp presence
    - **Property 21: Response Timestamp Presence**
    - **Validates: Requirements 12.1**

  - [ ]* 17.2 Write property test for data type consistency
    - **Property 22: Data Type Consistency**
    - **Validates: Requirements 12.2, 12.3, 12.4**

  - [ ]* 17.3 Write property test for standard error format
    - **Property 23: Standard Error Format**
    - **Validates: Requirements 12.5**

  - [ ]* 17.4 Write end-to-end integration tests
    - Test complete flow: API call → cache → database → response
    - Test cache invalidation flow: data change → cache clear → fresh data
    - Test permission flow: different roles → different data access
    - Test error flow: database failure → cache fallback → error response
    - _Requirements: 1.1-12.5_

- [ ] 18. Final Checkpoint - Complete system verification
  - Ensure all tests pass (unit, property, integration)
  - Verify frontend components display real data
  - Verify cache invalidation works on data changes
  - Verify permission checks work correctly
  - Verify error handling provides graceful degradation
  - Ask user if any issues or questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Frontend tasks focus on replacing hardcoded data with API calls
- Cache invalidation is critical for data freshness
