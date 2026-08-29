# Requirements Document

## Introduction

Dashboard Statistics API menyediakan endpoint backend untuk menampilkan statistik real-time pada dashboard frontend WargaNet. Fitur ini menggantikan data hardcoded yang saat ini digunakan di komponen FinancialSummary, StatsGrid, dan ProjectsOverview dengan data aktual dari database.

## Glossary

- **Dashboard_API**: Backend API endpoints yang menyediakan data statistik dashboard
- **Statistics_Service**: Service layer yang menghitung dan mengagregasi data statistik
- **Cache_Layer**: Redis cache untuk menyimpan hasil perhitungan statistik
- **Frontend_Component**: React component yang menampilkan data statistik
- **Active_Resident**: Warga dengan status aktif (isActive = true)
- **Active_Fee**: Jenis iuran yang masih berlaku (isActive = true)
- **Bill_Status**: Status tagihan (PENDING, PAID, OVERDUE, CANCELLED)
- **Financial_Period**: Periode waktu untuk perhitungan finansial (monthly, yearly)
- **Aggregation_Query**: Database query yang menghitung total, sum, atau count
- **TTL**: Time To Live untuk cache (dalam detik)

## Requirements

### Requirement 1: Overall Statistics Endpoint

**User Story:** As a dashboard user, I want to see overall statistics about residents, families, and fees, so that I can quickly understand the current state of the community.

#### Acceptance Criteria

1. WHEN a GET request is made to /api/v1/dashboard/stats, THE Dashboard_API SHALL return total active residents count as integer
2. WHEN a GET request is made to /api/v1/dashboard/stats, THE Dashboard_API SHALL return total families count as integer
3. WHEN a GET request is made to /api/v1/dashboard/stats, THE Dashboard_API SHALL return active fee types count as integer
4. WHEN a GET request is made to /api/v1/dashboard/stats, THE Dashboard_API SHALL return total fees amount for current month as number
5. WHEN a GET request is made to /api/v1/dashboard/stats, THE Dashboard_API SHALL return pending bills count for current month as integer
6. WHEN a GET request is made to /api/v1/dashboard/stats, THE Dashboard_API SHALL return paid bills count for current month as integer
7. WHEN a GET request is made to /api/v1/dashboard/stats, THE Dashboard_API SHALL return response in format: { totalResidents, totalFamilies, activeFeeTypes, totalFeesAmount, pendingBillsCount, paidBillsCount, timestamp }

### Requirement 2: Financial Summary Endpoint

**User Story:** As a dashboard user, I want to see monthly income and expense breakdown, so that I can track financial trends over time.

#### Acceptance Criteria

1. WHEN a GET request is made to /api/v1/dashboard/financial-summary, THE Dashboard_API SHALL return 12 months of income data as array of objects with month name and amount
2. WHEN a GET request is made to /api/v1/dashboard/financial-summary, THE Dashboard_API SHALL return 12 months of expense data as array of objects with month name and amount
3. WHEN a year query parameter is provided, THE Dashboard_API SHALL return data for the specified year
4. WHEN no year parameter is provided, THE Dashboard_API SHALL default to current year
5. WHEN calculating monthly income, THE Dashboard_API SHALL sum all paid bills for each month
6. WHEN calculating monthly expenses, THE Dashboard_API SHALL sum all recorded expenses for each month
7. WHEN returning monthly data, THE Dashboard_API SHALL use month abbreviations (Jan, Feb, Mar, etc.) for consistency with frontend
8. WHEN returning financial summary, THE Dashboard_API SHALL include totalIncome, totalExpense, and balance (income - expense) in response

### Requirement 3: Activity Summary Endpoint

**User Story:** As a dashboard user, I want to see recent activity metrics, so that I can monitor transaction volume and trends.

#### Acceptance Criteria

1. WHEN a GET request is made to /api/v1/dashboard/activity-summary, THE Dashboard_API SHALL return weekly transaction count
2. WHEN a GET request is made to /api/v1/dashboard/activity-summary, THE Dashboard_API SHALL return monthly transaction count
3. WHEN a GET request is made to /api/v1/dashboard/activity-summary, THE Dashboard_API SHALL return total fees collected for current month
4. WHEN a GET request is made to /api/v1/dashboard/activity-summary, THE Dashboard_API SHALL return transaction trend percentage (compared to previous period)
5. WHEN a GET request is made to /api/v1/dashboard/activity-summary, THE Dashboard_API SHALL return daily transaction counts for the last 7 days (for mini chart visualization)
6. WHEN a period query parameter is provided (weekly/monthly), THE Dashboard_API SHALL return data for the specified period

### Requirement 4: Data Caching

**User Story:** As a system administrator, I want dashboard statistics to be cached, so that database load is minimized and response times are fast.

#### Acceptance Criteria

1. WHEN statistics are calculated, THE Cache_Layer SHALL store results in Redis with 5 minutes TTL
2. WHEN a statistics request is received, THE Statistics_Service SHALL check cache before querying database
3. WHEN cached data exists and is not expired, THE Statistics_Service SHALL return cached data
4. WHEN cached data does not exist or is expired, THE Statistics_Service SHALL query database and update cache
5. WHEN financial data is modified (payment, expense, bill), THE Cache_Layer SHALL invalidate related cache entries

### Requirement 5: Database Query Optimization

**User Story:** As a system administrator, I want statistics queries to be optimized, so that dashboard loads quickly even with large datasets.

#### Acceptance Criteria

1. WHEN calculating statistics, THE Statistics_Service SHALL use aggregation queries (COUNT, SUM) instead of fetching all records
2. WHEN querying residents, THE Aggregation_Query SHALL use index on isActive field
3. WHEN querying bills by status, THE Aggregation_Query SHALL use index on status field
4. WHEN querying financial data by date, THE Aggregation_Query SHALL use index on createdAt field
5. WHEN calculating monthly totals, THE Aggregation_Query SHALL use database date functions for grouping

### Requirement 6: Permission-Based Access

**User Story:** As a system administrator, I want to control access to financial data, so that sensitive information is only visible to authorized users.

#### Acceptance Criteria

1. WHEN any authenticated user requests /api/v1/dashboard/stats, THE Dashboard_API SHALL return basic statistics (residents, families counts)
2. WHEN a user with ADMIN_RT role requests financial endpoints, THE Dashboard_API SHALL return all financial data
3. WHEN a user with ADMIN_BENDAHARA role requests financial endpoints, THE Dashboard_API SHALL return all financial data
4. WHEN a user with WARGA role requests financial endpoints, THE Dashboard_API SHALL return limited financial data (only their own bills)
5. WHEN a user without financial permissions requests financial data, THE Dashboard_API SHALL return 403 Forbidden error

### Requirement 7: Frontend Integration - FinancialSummary Component

**User Story:** As a dashboard user, I want to see real financial data in the chart, so that I can track actual income and expenses.

#### Acceptance Criteria

1. WHEN FinancialSummary component mounts, THE Frontend_Component SHALL fetch data from /api/v1/dashboard/financial-summary
2. WHEN data is loading, THE Frontend_Component SHALL display loading skeleton
3. WHEN data fetch fails, THE Frontend_Component SHALL display error message with retry button
4. WHEN data is received, THE Frontend_Component SHALL render chart with actual income/expense values
5. WHEN user changes year filter, THE Frontend_Component SHALL refetch data for selected year

### Requirement 8: Frontend Integration - StatsGrid Component

**User Story:** As a dashboard user, I want to see real statistics in the stats cards, so that I have accurate information about the community.

#### Acceptance Criteria

1. WHEN StatsGrid component mounts, THE Frontend_Component SHALL fetch data from /api/v1/dashboard/stats
2. WHEN data is loading, THE Frontend_Component SHALL display loading skeleton for each card
3. WHEN data fetch fails, THE Frontend_Component SHALL display error state
4. WHEN data is received, THE Frontend_Component SHALL update all stat cards with actual values
5. WHEN user refreshes dashboard, THE Frontend_Component SHALL refetch latest statistics

### Requirement 9: Frontend Integration - ProjectsOverview Component

**User Story:** As a dashboard user, I want to see real activity metrics, so that I can monitor recent transactions and trends.

#### Acceptance Criteria

1. WHEN ProjectsOverview component mounts, THE Frontend_Component SHALL fetch data from /api/v1/dashboard/activity-summary
2. WHEN data is loading, THE Frontend_Component SHALL display loading state
3. WHEN data fetch fails, THE Frontend_Component SHALL display error message
4. WHEN data is received, THE Frontend_Component SHALL display total fees and transaction counts
5. WHEN trend data is available, THE Frontend_Component SHALL display trend percentage with up/down indicator

### Requirement 10: Error Handling and Resilience

**User Story:** As a dashboard user, I want the dashboard to handle errors gracefully, so that I can still use the application when some data is unavailable.

#### Acceptance Criteria

1. WHEN database query fails, THE Statistics_Service SHALL log error and return cached data if available
2. WHEN cache is unavailable, THE Statistics_Service SHALL continue with database queries
3. WHEN a statistics calculation fails, THE Dashboard_API SHALL return partial data with error indicators
4. WHEN frontend fetch fails, THE Frontend_Component SHALL display last known data if available
5. WHEN multiple retries fail, THE Frontend_Component SHALL display user-friendly error message

### Requirement 11: Data Refresh Capability

**User Story:** As a dashboard user, I want to manually refresh dashboard data, so that I can see the latest information on demand.

#### Acceptance Criteria

1. WHEN user clicks refresh button, THE Frontend_Component SHALL invalidate cache and fetch fresh data
2. WHEN refresh is triggered, THE Frontend_Component SHALL show loading indicator
3. WHEN refresh completes, THE Frontend_Component SHALL update all components with new data
4. WHEN refresh fails, THE Frontend_Component SHALL display error and keep existing data
5. WHEN auto-refresh is enabled, THE Frontend_Component SHALL refresh data every 5 minutes

### Requirement 12: Response Format and Data Types

**User Story:** As a frontend developer, I want consistent API response formats, so that I can reliably parse and display data.

#### Acceptance Criteria

1. WHEN Dashboard_API returns statistics, THE response SHALL include timestamp of data generation
2. WHEN Dashboard_API returns financial data, THE response SHALL use number type for amounts (not string)
3. WHEN Dashboard_API returns counts, THE response SHALL use integer type
4. WHEN Dashboard_API returns trends, THE response SHALL include percentage as number with sign indicator
5. WHEN Dashboard_API encounters errors, THE response SHALL follow standard error format with status code and message
