# Design Document: Dashboard Statistics API

## Overview

Dashboard Statistics API menyediakan backend endpoints untuk menampilkan statistik real-time pada dashboard frontend WargaNet. API ini menggantikan data hardcoded dengan data aktual dari database, menggunakan Redis caching untuk performa optimal, dan query aggregation untuk efisiensi database.

Fitur ini mengintegrasikan data dari multiple modules (users, families, bills, payments, expenses, fee types) dan menyajikannya dalam format yang siap digunakan oleh frontend components (FinancialSummary, StatsGrid, ProjectsOverview).

## Architecture

### Module Structure

```
apps/backend/src/
├── dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   ├── dto/
│   │   ├── overall-stats.dto.ts
│   │   ├── financial-summary.dto.ts
│   │   └── activity-summary.dto.ts
│   └── tests/
│       └── dashboard.integration.spec.ts
```

### Dependencies

- **PrismaService**: Database queries dan aggregations
- **RedisService**: Caching layer dengan TTL management
- **PermissionsGuard**: Role-based access control
- **JwtAuthGuard**: Authentication


## Components and Interfaces

### 1. Dashboard Controller

**Endpoints:**

```typescript
@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  
  // GET /api/v1/dashboard/stats
  @Get('stats')
  async getOverallStats(@CurrentUser() user: User): Promise<OverallStatsDto>
  
  // GET /api/v1/dashboard/financial-summary?year=2025
  @Get('financial-summary')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('financial', 'view')
  async getFinancialSummary(
    @Query('year') year?: number,
    @CurrentUser() user: User
  ): Promise<FinancialSummaryDto>
  
  // GET /api/v1/dashboard/activity-summary?period=weekly
  @Get('activity-summary')
  async getActivitySummary(
    @Query('period') period?: 'weekly' | 'monthly',
    @CurrentUser() user: User
  ): Promise<ActivitySummaryDto>
  
  // POST /api/v1/dashboard/refresh
  @Post('refresh')
  async refreshCache(@CurrentUser() user: User): Promise<{ message: string }>
}
```


### 2. Dashboard Service

**Core Methods:**

```typescript
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: Logger
  ) {}
  
  // Overall statistics dengan caching
  async getOverallStats(): Promise<OverallStatsDto>
  
  // Financial summary dengan monthly breakdown
  async getFinancialSummary(year: number): Promise<FinancialSummaryDto>
  
  // Activity summary dengan trend calculation
  async getActivitySummary(period: 'weekly' | 'monthly'): Promise<ActivitySummaryDto>
  
  // Cache management
  async invalidateCache(pattern: string): Promise<void>
  private async getCachedOrCompute<T>(key: string, computeFn: () => Promise<T>, ttl: number): Promise<T>
  
  // Database aggregation queries
  private async computeOverallStats(): Promise<OverallStatsDto>
  private async computeFinancialSummary(year: number): Promise<FinancialSummaryDto>
  private async computeActivitySummary(period: string): Promise<ActivitySummaryDto>
}
```

**Cache Key Strategy:**

```typescript
const CACHE_KEYS = {
  OVERALL_STATS: 'dashboard:stats:overall',
  FINANCIAL_SUMMARY: (year: number) => `dashboard:financial:${year}`,
  ACTIVITY_SUMMARY: (period: string) => `dashboard:activity:${period}`,
};

const CACHE_TTL = {
  OVERALL_STATS: 300, // 5 minutes
  FINANCIAL_SUMMARY: 300, // 5 minutes
  ACTIVITY_SUMMARY: 300, // 5 minutes
};
```


## Data Models

### DTO Definitions

**OverallStatsDto:**

```typescript
export class OverallStatsDto {
  totalResidents: number;        // Active residents count
  totalFamilies: number;         // Total families count
  activeFeeTypes: number;        // Active fee types count
  totalFeesAmount: number;       // Total fees for current month
  pendingBillsCount: number;     // Bills with status BELUM_BAYAR or SEBAGIAN
  paidBillsCount: number;        // Bills with status LUNAS
  timestamp: Date;               // Data generation timestamp
}
```

**FinancialSummaryDto:**

```typescript
export class MonthlyDataDto {
  month: string;                 // Month abbreviation (Jan, Feb, etc.)
  income: number;                // Total income for the month
  expense: number;               // Total expense for the month
}

export class FinancialSummaryDto {
  year: number;                  // Year of the data
  monthlyData: MonthlyDataDto[]; // 12 months of data
  totalIncome: number;           // Sum of all income
  totalExpense: number;          // Sum of all expenses
  balance: number;               // totalIncome - totalExpense
  timestamp: Date;               // Data generation timestamp
}
```

**ActivitySummaryDto:**

```typescript
export class DailyTransactionDto {
  date: string;                  // ISO date string
  count: number;                 // Transaction count for the day
}

export class ActivitySummaryDto {
  period: 'weekly' | 'monthly';  // Period type
  transactionCount: number;      // Total transactions in period
  totalFeesCollected: number;    // Total fees collected in period
  trendPercentage: number;       // Trend compared to previous period
  dailyTransactions: DailyTransactionDto[]; // Last 7 days for chart
  timestamp: Date;               // Data generation timestamp
}
```


### Database Query Patterns

**Overall Stats Query:**

```typescript
// Optimized aggregation queries
const [
  activeResidents,
  totalFamilies,
  activeFeeTypes,
  currentMonthBills
] = await Promise.all([
  // Count active residents
  prisma.user.count({
    where: { isActive: true, deletedAt: null }
  }),
  
  // Count families
  prisma.family.count({
    where: { deletedAt: null }
  }),
  
  // Count active fee types
  prisma.feeType.count({
    where: { isActive: true, deletedAt: null }
  }),
  
  // Get current month bills with aggregation
  prisma.bill.findMany({
    where: { period: currentPeriod },
    select: {
      status: true,
      totalAmount: true
    }
  })
]);
```

**Financial Summary Query:**

```typescript
// Monthly aggregation for income
const monthlyIncome = await prisma.payment.groupBy({
  by: ['createdAt'],
  where: {
    isVoided: false,
    createdAt: {
      gte: new Date(year, 0, 1),
      lte: new Date(year, 11, 31)
    }
  },
  _sum: { amount: true }
});

// Monthly aggregation for expenses
const monthlyExpenses = await prisma.expense.groupBy({
  by: ['createdAt'],
  where: {
    isVoided: false,
    createdAt: {
      gte: new Date(year, 0, 1),
      lte: new Date(year, 11, 31)
    }
  },
  _sum: { amount: true }
});
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Overall Stats Response Structure

*For any* request to /api/v1/dashboard/stats, the response should contain all required fields (totalResidents, totalFamilies, activeFeeTypes, totalFeesAmount, pendingBillsCount, paidBillsCount, timestamp) with correct data types (integers for counts, number for amounts, Date for timestamp).

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

### Property 2: Overall Stats Data Accuracy

*For any* database state, the overall stats counts should match the actual database counts (active residents where isActive=true and deletedAt=null, families where deletedAt=null, active fee types where isActive=true and deletedAt=null).

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 3: Current Month Bills Aggregation

*For any* current month period, the sum of totalFeesAmount should equal the sum of all bill totalAmount for that period, and pending/paid counts should match bills with corresponding statuses.

**Validates: Requirements 1.4, 1.5, 1.6**

### Property 4: Financial Summary Structure

*For any* year parameter, the financial summary response should contain exactly 12 months of data with month abbreviations (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec) and include totalIncome, totalExpense, balance, and timestamp fields.

**Validates: Requirements 2.1, 2.2, 2.7, 2.8**

### Property 5: Financial Summary Year Parameter

*For any* valid year parameter, the returned data should only include transactions from that specific year, and when no year parameter is provided, it should default to the current year.

**Validates: Requirements 2.3, 2.4**


### Property 6: Financial Aggregation Accuracy

*For any* year and month, the monthly income should equal the sum of all non-voided payments created in that month, and monthly expense should equal the sum of all non-voided expenses created in that month.

**Validates: Requirements 2.5, 2.6**

### Property 7: Balance Calculation

*For any* financial summary response, the balance field should equal totalIncome minus totalExpense.

**Validates: Requirements 2.8**

### Property 8: Activity Summary Transaction Counting

*For any* period (weekly or monthly), the transaction count should equal the total number of payments and expenses created within that period.

**Validates: Requirements 3.1, 3.2**

### Property 9: Activity Summary Fees Collected

*For any* current month, the total fees collected should equal the sum of all non-voided payments created in that month.

**Validates: Requirements 3.3**

### Property 10: Trend Percentage Calculation

*For any* period, the trend percentage should be calculated as ((current period count - previous period count) / previous period count) * 100, with proper handling of zero division.

**Validates: Requirements 3.4**

### Property 11: Daily Transaction Data Structure

*For any* activity summary request, the dailyTransactions array should contain exactly 7 elements representing the last 7 days with date and count fields.

**Validates: Requirements 3.5**

### Property 12: Period Parameter Handling

*For any* valid period parameter (weekly or monthly), the activity summary should return data for the specified period with correct date range calculations.

**Validates: Requirements 3.6**


### Property 13: Cache Storage with TTL

*For any* statistics calculation, the result should be stored in Redis with a 5-minute (300 seconds) TTL using the appropriate cache key.

**Validates: Requirements 4.1**

### Property 14: Cache-First Strategy

*For any* statistics request, if valid cached data exists (not expired), it should be returned without querying the database; if cache is empty or expired, database should be queried and cache should be updated.

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 15: Cache Invalidation on Data Modification

*For any* financial data modification (payment creation, expense creation, bill update), related cache entries should be invalidated to ensure data freshness.

**Validates: Requirements 4.5**

### Property 16: Admin Role Financial Access

*For any* user with ADMIN_RT or ADMIN_BENDAHARA role, requests to financial endpoints should return all financial data without restrictions.

**Validates: Requirements 6.2, 6.3**

### Property 17: Warga Role Data Filtering

*For any* user with WARGA role, requests to financial endpoints should only return data related to their own bills and payments.

**Validates: Requirements 6.4**

### Property 18: Unauthorized Access Rejection

*For any* user without financial permissions, requests to financial endpoints should return 403 Forbidden error.

**Validates: Requirements 6.5**

### Property 19: Database Failure Fallback

*For any* database query failure, if cached data exists, it should be returned; if cache is also unavailable, an appropriate error should be returned.

**Validates: Requirements 10.1, 10.2**


### Property 20: Partial Data on Calculation Failure

*For any* statistics calculation failure, the API should return partial data with error indicators rather than failing completely.

**Validates: Requirements 10.3**

### Property 21: Response Timestamp Presence

*For any* successful API response, a timestamp field should be present indicating when the data was generated.

**Validates: Requirements 12.1**

### Property 22: Data Type Consistency

*For any* API response, amounts should be number type, counts should be integer type, and trend percentages should be number type.

**Validates: Requirements 12.2, 12.3, 12.4**

### Property 23: Standard Error Format

*For any* API error, the response should follow standard error format with appropriate HTTP status code and descriptive error message.

**Validates: Requirements 12.5**


## Error Handling

### Error Scenarios

**Database Connection Failure:**
```typescript
try {
  const stats = await this.computeOverallStats();
  return stats;
} catch (error) {
  this.logger.error('Database query failed', error);
  
  // Try to return cached data
  const cached = await this.redis.get(CACHE_KEYS.OVERALL_STATS);
  if (cached) {
    this.logger.warn('Returning cached data due to database failure');
    return JSON.parse(cached);
  }
  
  throw new ServiceUnavailableException('Unable to fetch statistics');
}
```

**Redis Connection Failure:**
```typescript
async getCachedOrCompute<T>(key: string, computeFn: () => Promise<T>, ttl: number): Promise<T> {
  try {
    // Try cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    this.logger.warn('Redis unavailable, proceeding with database query', error);
  }
  
  // Compute from database
  const result = await computeFn();
  
  // Try to cache result
  try {
    await this.redis.setex(key, ttl, JSON.stringify(result));
  } catch (error) {
    this.logger.warn('Failed to cache result', error);
  }
  
  return result;
}
```

**Partial Calculation Failure:**
```typescript
async getOverallStats(): Promise<OverallStatsDto> {
  const errors: string[] = [];
  let stats: Partial<OverallStatsDto> = {
    timestamp: new Date()
  };
  
  try {
    stats.totalResidents = await this.prisma.user.count({
      where: { isActive: true, deletedAt: null }
    });
  } catch (error) {
    errors.push('Failed to count residents');
    stats.totalResidents = 0;
  }
  
  // Continue with other calculations...
  
  if (errors.length > 0) {
    this.logger.warn('Partial statistics failure', { errors });
  }
  
  return stats as OverallStatsDto;
}
```


### Permission-Based Error Handling

```typescript
@Get('financial-summary')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('financial', 'view')
async getFinancialSummary(
  @Query('year') year?: number,
  @CurrentUser() user: User
): Promise<FinancialSummaryDto> {
  // Permission guard akan throw ForbiddenException jika user tidak punya permission
  // Controller hanya akan dieksekusi jika user authorized
  
  const targetYear = year || new Date().getFullYear();
  
  // Untuk WARGA role, filter data berdasarkan userId
  if (user.role.name === 'WARGA') {
    return this.dashboardService.getFinancialSummaryForUser(targetYear, user.id);
  }
  
  // Untuk admin roles, return all data
  return this.dashboardService.getFinancialSummary(targetYear);
}
```

### Validation Error Handling

```typescript
@Get('financial-summary')
async getFinancialSummary(
  @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  @CurrentUser() user: User
): Promise<FinancialSummaryDto> {
  // Validate year range
  if (year && (year < 2020 || year > 2100)) {
    throw new BadRequestException('Year must be between 2020 and 2100');
  }
  
  const targetYear = year || new Date().getFullYear();
  return this.dashboardService.getFinancialSummary(targetYear);
}
```


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of statistics calculations
- Edge cases (empty database, single record, etc.)
- Error conditions (database failure, cache failure)
- Permission checks for different roles
- Cache invalidation triggers

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Data accuracy across random database states
- Response structure consistency
- Aggregation correctness
- Cache behavior patterns

### Property-Based Testing Configuration

**Library:** Use `fast-check` for TypeScript property-based testing

**Configuration:**
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: dashboard-statistics-api, Property {number}: {property_text}`

**Example Property Test:**

```typescript
// Feature: dashboard-statistics-api, Property 7: Balance Calculation
describe('Financial Summary Balance', () => {
  it('should calculate balance as income minus expense', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2020, max: 2030 }),
        async (year) => {
          const summary = await dashboardService.getFinancialSummary(year);
          
          // Property: balance = totalIncome - totalExpense
          expect(summary.balance).toBe(summary.totalIncome - summary.totalExpense);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```


### Unit Testing Patterns

**Controller Tests:**

```typescript
describe('DashboardController', () => {
  describe('GET /api/v1/dashboard/stats', () => {
    it('should return overall statistics for authenticated user', async () => {
      const mockStats = {
        totalResidents: 96,
        totalFamilies: 24,
        activeFeeTypes: 12,
        totalFeesAmount: 8500000,
        pendingBillsCount: 5,
        paidBillsCount: 91,
        timestamp: new Date()
      };
      
      jest.spyOn(dashboardService, 'getOverallStats').mockResolvedValue(mockStats);
      
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toMatchObject(mockStats);
    });
    
    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .expect(401);
    });
  });
  
  describe('GET /api/v1/dashboard/financial-summary', () => {
    it('should return 403 for users without financial permissions', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/financial-summary')
        .set('Authorization', `Bearer ${wargaToken}`)
        .expect(403);
    });
    
    it('should return financial summary for admin users', async () => {
      const mockSummary = {
        year: 2025,
        monthlyData: [],
        totalIncome: 38000000,
        totalExpense: 5200000,
        balance: 32800000,
        timestamp: new Date()
      };
      
      jest.spyOn(dashboardService, 'getFinancialSummary').mockResolvedValue(mockSummary);
      
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/financial-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toMatchObject(mockSummary);
    });
  });
});
```


**Service Tests:**

```typescript
describe('DashboardService', () => {
  describe('getOverallStats', () => {
    it('should return cached data when available', async () => {
      const cachedStats = {
        totalResidents: 96,
        totalFamilies: 24,
        activeFeeTypes: 12,
        totalFeesAmount: 8500000,
        pendingBillsCount: 5,
        paidBillsCount: 91,
        timestamp: new Date()
      };
      
      jest.spyOn(redisService, 'get').mockResolvedValue(JSON.stringify(cachedStats));
      const prismaSpy = jest.spyOn(prisma.user, 'count');
      
      const result = await dashboardService.getOverallStats();
      
      expect(result).toMatchObject(cachedStats);
      expect(prismaSpy).not.toHaveBeenCalled(); // Database not queried
    });
    
    it('should query database and cache result when cache is empty', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(redisService, 'setex').mockResolvedValue();
      
      const result = await dashboardService.getOverallStats();
      
      expect(result).toBeDefined();
      expect(redisService.setex).toHaveBeenCalledWith(
        CACHE_KEYS.OVERALL_STATS,
        300,
        expect.any(String)
      );
    });
    
    it('should handle database failure gracefully', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'count').mockRejectedValue(new Error('Database error'));
      
      await expect(dashboardService.getOverallStats()).rejects.toThrow();
    });
  });
  
  describe('getFinancialSummary', () => {
    it('should return 12 months of data', async () => {
      const result = await dashboardService.getFinancialSummary(2025);
      
      expect(result.monthlyData).toHaveLength(12);
      expect(result.monthlyData[0].month).toBe('Jan');
      expect(result.monthlyData[11].month).toBe('Dec');
    });
    
    it('should calculate balance correctly', async () => {
      const result = await dashboardService.getFinancialSummary(2025);
      
      expect(result.balance).toBe(result.totalIncome - result.totalExpense);
    });
  });
  
  describe('invalidateCache', () => {
    it('should delete cache entries matching pattern', async () => {
      jest.spyOn(redisService, 'keys').mockResolvedValue([
        'dashboard:stats:overall',
        'dashboard:financial:2025'
      ]);
      jest.spyOn(redisService, 'mdel').mockResolvedValue();
      
      await dashboardService.invalidateCache('dashboard:*');
      
      expect(redisService.mdel).toHaveBeenCalledWith(
        'dashboard:stats:overall',
        'dashboard:financial:2025'
      );
    });
  });
});
```


### Integration Tests

```typescript
describe('Dashboard Integration Tests', () => {
  beforeEach(async () => {
    // Seed test data
    await seedTestData();
  });
  
  afterEach(async () => {
    // Clean up
    await cleanupTestData();
    await redisService.del('dashboard:*');
  });
  
  it('should return accurate statistics from real database', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    // Verify against actual database counts
    const actualResidents = await prisma.user.count({
      where: { isActive: true, deletedAt: null }
    });
    
    expect(response.body.totalResidents).toBe(actualResidents);
  });
  
  it('should invalidate cache when payment is created', async () => {
    // Get initial stats (will be cached)
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    
    // Create a payment (should invalidate cache)
    await paymentsService.recordPayment({
      billId: testBillId,
      amount: 100000,
      method: 'CASH'
    }, adminUserId);
    
    // Get stats again (should query database, not cache)
    const response = await request(app.getHttpServer())
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    // Verify updated data
    expect(response.body.paidBillsCount).toBeGreaterThan(0);
  });
  
  it('should filter financial data for WARGA role', async () => {
    const wargaUser = await createTestUser('WARGA');
    const wargaToken = await generateToken(wargaUser);
    
    const response = await request(app.getHttpServer())
      .get('/api/v1/dashboard/financial-summary')
      .set('Authorization', `Bearer ${wargaToken}`)
      .expect(200);
    
    // Verify only user's own data is returned
    // (implementation depends on how we filter for WARGA)
    expect(response.body).toBeDefined();
  });
});
```


## Performance Optimization

### Database Query Optimization

**Use Aggregation Queries:**

```typescript
// ❌ BURUK - Fetch all records then count
const users = await prisma.user.findMany({ where: { isActive: true } });
const count = users.length;

// ✅ BAIK - Use aggregation
const count = await prisma.user.count({ where: { isActive: true } });
```

**Parallel Queries:**

```typescript
// Execute independent queries in parallel
const [residents, families, feeTypes, bills] = await Promise.all([
  prisma.user.count({ where: { isActive: true, deletedAt: null } }),
  prisma.family.count({ where: { deletedAt: null } }),
  prisma.feeType.count({ where: { isActive: true, deletedAt: null } }),
  prisma.bill.findMany({ where: { period: currentPeriod } })
]);
```

**Index Usage:**

Ensure database indexes exist for frequently queried fields:

```sql
-- Already defined in schema.prisma
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_period ON bills(period);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);
```

### Caching Strategy

**Cache Key Design:**

```typescript
const CACHE_KEYS = {
  OVERALL_STATS: 'dashboard:stats:overall',
  FINANCIAL_SUMMARY: (year: number) => `dashboard:financial:${year}`,
  ACTIVITY_SUMMARY: (period: string) => `dashboard:activity:${period}`,
};
```

**Cache Invalidation Patterns:**

```typescript
// Invalidate on payment creation
async recordPayment(dto: RecordPaymentDto, userId: string) {
  const payment = await this.prisma.payment.create({ data: dto });
  
  // Invalidate related caches
  await this.dashboardService.invalidateCache('dashboard:stats:*');
  await this.dashboardService.invalidateCache('dashboard:activity:*');
  
  return payment;
}

// Invalidate on expense creation
async recordExpense(dto: RecordExpenseDto, userId: string) {
  const expense = await this.prisma.expense.create({ data: dto });
  
  // Invalidate related caches
  await this.dashboardService.invalidateCache('dashboard:financial:*');
  await this.dashboardService.invalidateCache('dashboard:activity:*');
  
  return expense;
}
```


### Response Time Targets

**Performance Goals:**

- Overall Stats: < 100ms (with cache), < 500ms (without cache)
- Financial Summary: < 200ms (with cache), < 1000ms (without cache)
- Activity Summary: < 150ms (with cache), < 800ms (without cache)

**Monitoring:**

```typescript
@Injectable()
export class DashboardService {
  async getOverallStats(): Promise<OverallStatsDto> {
    const startTime = Date.now();
    
    try {
      const stats = await this.getCachedOrCompute(
        CACHE_KEYS.OVERALL_STATS,
        () => this.computeOverallStats(),
        CACHE_TTL.OVERALL_STATS
      );
      
      const duration = Date.now() - startTime;
      this.logger.log(`getOverallStats completed in ${duration}ms`);
      
      return stats;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`getOverallStats failed after ${duration}ms`, error);
      throw error;
    }
  }
}
```

## Frontend Integration

### Service Layer

**Create Dashboard Service:**

```typescript
// apps/frontend/src/services/dashboard.service.ts
import { api } from './api';

export interface OverallStats {
  totalResidents: number;
  totalFamilies: number;
  activeFeeTypes: number;
  totalFeesAmount: number;
  pendingBillsCount: number;
  paidBillsCount: number;
  timestamp: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface FinancialSummary {
  year: number;
  monthlyData: MonthlyData[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  timestamp: string;
}

export interface DailyTransaction {
  date: string;
  count: number;
}

export interface ActivitySummary {
  period: 'weekly' | 'monthly';
  transactionCount: number;
  totalFeesCollected: number;
  trendPercentage: number;
  dailyTransactions: DailyTransaction[];
  timestamp: string;
}

export const dashboardService = {
  async getOverallStats(): Promise<OverallStats> {
    const response = await api.get('/api/v1/dashboard/stats');
    return response.data;
  },

  async getFinancialSummary(year?: number): Promise<FinancialSummary> {
    const params = year ? { year } : {};
    const response = await api.get('/api/v1/dashboard/financial-summary', { params });
    return response.data;
  },

  async getActivitySummary(period?: 'weekly' | 'monthly'): Promise<ActivitySummary> {
    const params = period ? { period } : {};
    const response = await api.get('/api/v1/dashboard/activity-summary', { params });
    return response.data;
  },

  async refreshCache(): Promise<void> {
    await api.post('/api/v1/dashboard/refresh');
  }
};
```


### Component Integration

**Update StatsGrid Component:**

```typescript
// apps/frontend/src/components/dashboard/StatsGrid.tsx
import { useEffect, useState } from 'react';
import { dashboardService, OverallStats } from '../../services/dashboard.service';
import { StatCard } from './StatCard';

export function StatsGrid() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getOverallStats();
      setStats(data);
    } catch (err) {
      setError('Gagal memuat statistik');
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <StatsGridSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={loadStats} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded">
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        icon={<UsersIcon />}
        value={stats.totalResidents.toString()}
        label="Warga"
        iconBgColor="bg-primary-500"
      />
      <StatCard
        icon={<FolderIcon />}
        value={stats.totalFamilies.toString()}
        label="Keluarga"
        iconBgColor="bg-green-500"
      />
      <StatCard
        icon={<ChartIcon />}
        value={stats.activeFeeTypes.toString()}
        label="Iuran Aktif"
        iconBgColor="bg-purple-500"
      />
      <StatCard
        icon={<CashIcon />}
        value={`Rp ${(stats.totalFeesAmount / 1000000).toFixed(1)}jt`}
        label="Total Iuran"
        iconBgColor="bg-blue-500"
      />
      <StatCard
        icon={<ClockIcon />}
        value={stats.pendingBillsCount.toString()}
        label="Pending"
        iconBgColor="bg-yellow-500"
      />
      <StatCard
        icon={<CheckIcon />}
        value={stats.paidBillsCount.toString()}
        label="Lunas"
        iconBgColor="bg-emerald-500"
      />
    </div>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24 animate-pulse" />
      ))}
    </div>
  );
}
```


**Update FinancialSummary Component:**

```typescript
// apps/frontend/src/components/dashboard/FinancialSummary.tsx
import { useEffect, useState } from 'react';
import { dashboardService, FinancialSummary as FinancialSummaryData } from '../../services/dashboard.service';
import { Card } from '../ui/Card';

export function FinancialSummary() {
  const [data, setData] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await dashboardService.getFinancialSummary(selectedYear);
      setData(summary);
    } catch (err) {
      setError('Gagal memuat ringkasan keuangan');
      console.error('Failed to load financial summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FinancialSummarySkeleton />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadData} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded">
            Coba Lagi
          </button>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const maxValue = Math.max(...data.monthlyData.map(d => d.income));

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Ringkasan Keuangan
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tahun {data.year}
          </p>
        </div>
        <select 
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg border-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
        >
          <option value={2025}>Tahun 2025</option>
          <option value={2024}>Tahun 2024</option>
          <option value={2023}>Tahun 2023</option>
        </select>
      </div>

      {/* Legend dengan total */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-sm bg-primary-500 mt-1 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Pemasukan</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Rp {(data.totalIncome / 1000000).toFixed(1)}jt
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-sm bg-red-500 mt-1 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Rp {(data.totalExpense / 1000000).toFixed(1)}jt
            </p>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="relative">
        <div className="flex items-end justify-between gap-1 h-48 mb-2">
          {data.monthlyData.map((monthData, index) => {
            const incomeHeight = (monthData.income / maxValue) * 100;
            const expenseHeight = (monthData.expense / maxValue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex flex-col items-center gap-1 h-full justify-end">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-primary-500 rounded-t transition-all duration-300 group-hover:bg-primary-600"
                      style={{ height: `${incomeHeight * 1.8}px` }}
                      title={`${monthData.month}: Rp ${(monthData.income / 1000000).toFixed(1)}jt`}
                    />
                  </div>
                  <div className="relative w-full">
                    <div
                      className="w-full bg-red-500 rounded-b transition-all duration-300 group-hover:bg-red-600"
                      style={{ height: `${expenseHeight * 1.8}px` }}
                      title={`${monthData.month}: Rp ${(monthData.expense / 1000000).toFixed(1)}jt`}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {monthData.month}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Saldo</span>
          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
            Rp {(data.balance / 1000000).toFixed(1)}jt
          </span>
        </div>
      </div>
    </Card>
  );
}

function FinancialSummarySkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </Card>
  );
}
```


**Update ProjectsOverview Component:**

```typescript
// apps/frontend/src/components/dashboard/ProjectsOverview.tsx
import { useEffect, useState } from 'react';
import { dashboardService, ActivitySummary } from '../../services/dashboard.service';
import { Card } from '../ui/Card';

export function ProjectsOverview() {
  const [data, setData] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await dashboardService.getActivitySummary(period);
      setData(summary);
    } catch (err) {
      setError('Gagal memuat ringkasan aktivitas');
      console.error('Failed to load activity summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ProjectsOverviewSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadData} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded">
            Coba Lagi
          </button>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  // Calculate bar heights for mini chart
  const maxCount = Math.max(...data.dailyTransactions.map(d => d.count));
  const barHeights = data.dailyTransactions.map(d => (d.count / maxCount) * 100);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Ringkasan Aktivitas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {period === 'weekly' ? 'Minggu ini' : 'Bulan ini'}
          </p>
        </div>
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly')}
          className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg border-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
        >
          <option value="weekly">Minggu ini</option>
          <option value="monthly">Bulan ini</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-4">
        <ProjectStat
          value={`Rp ${(data.totalFeesCollected / 1000000).toFixed(1)}jt`}
          change={`${data.trendPercentage > 0 ? '+' : ''}${data.trendPercentage.toFixed(0)}%`}
          label={`Total Iuran ${period === 'weekly' ? 'Minggu' : 'Bulan'} Ini`}
          isPositive={data.trendPercentage >= 0}
          barColor="bg-purple-500"
          barHeights={barHeights}
        />
        <ProjectStat
          value={data.transactionCount.toString()}
          change={`${data.trendPercentage > 0 ? '+' : ''}${data.trendPercentage.toFixed(0)}%`}
          label={`Transaksi ${period === 'weekly' ? 'Minggu' : 'Bulan'} Ini`}
          isPositive={data.trendPercentage >= 0}
          barColor="bg-primary-500"
          barHeights={barHeights}
        />
      </div>
    </Card>
  );
}

function ProjectsOverviewSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </Card>
  );
}

// ProjectStat component remains the same as before
```


## Security Considerations

### Authentication & Authorization

**JWT Authentication:**
- All endpoints require valid JWT token
- Token must be included in Authorization header
- Expired tokens return 401 Unauthorized

**Role-Based Access Control:**
- Overall stats: Accessible to all authenticated users
- Financial endpoints: Require 'financial:view' permission
- WARGA role: Can only view their own financial data
- Admin roles (ADMIN_RT, ADMIN_BENDAHARA): Can view all financial data

### Data Privacy

**User Data Filtering:**

```typescript
async getFinancialSummaryForUser(year: number, userId: string): Promise<FinancialSummaryDto> {
  // Only include payments and expenses related to this user
  const monthlyIncome = await this.prisma.payment.groupBy({
    by: ['createdAt'],
    where: {
      userId,  // Filter by user
      isVoided: false,
      createdAt: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31)
      }
    },
    _sum: { amount: true }
  });
  
  // Process and return filtered data
  return this.processFinancialData(monthlyIncome, year);
}
```

### Input Validation

**Query Parameter Validation:**

```typescript
@Get('financial-summary')
async getFinancialSummary(
  @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  @CurrentUser() user: User
): Promise<FinancialSummaryDto> {
  // Validate year range
  if (year && (year < 2020 || year > 2100)) {
    throw new BadRequestException('Year must be between 2020 and 2100');
  }
  
  const targetYear = year || new Date().getFullYear();
  return this.dashboardService.getFinancialSummary(targetYear);
}
```

### Rate Limiting

**Apply Rate Limits:**

```typescript
@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@RateLimit({ points: 100, duration: 60 }) // 100 requests per minute
export class DashboardController {
  // Endpoints...
}
```


## Deployment Considerations

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/warganet

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
```

### Health Checks

**Dashboard Health Endpoint:**

```typescript
@Get('health')
async checkHealth(): Promise<{ status: string; cache: string; database: string }> {
  const cacheHealthy = await this.redis.isHealthy();
  const dbHealthy = await this.prisma.$queryRaw`SELECT 1`;
  
  return {
    status: cacheHealthy && dbHealthy ? 'healthy' : 'degraded',
    cache: cacheHealthy ? 'connected' : 'disconnected',
    database: dbHealthy ? 'connected' : 'disconnected'
  };
}
```

### Monitoring & Logging

**Log Important Events:**

```typescript
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  
  async getOverallStats(): Promise<OverallStatsDto> {
    this.logger.log('Fetching overall statistics');
    
    try {
      const stats = await this.getCachedOrCompute(
        CACHE_KEYS.OVERALL_STATS,
        () => this.computeOverallStats(),
        CACHE_TTL.OVERALL_STATS
      );
      
      this.logger.log('Overall statistics fetched successfully');
      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch overall statistics', error);
      throw error;
    }
  }
}
```

### Backup & Recovery

**Cache Warming Strategy:**

```typescript
// Warm up cache on application startup
@Injectable()
export class DashboardService implements OnModuleInit {
  async onModuleInit() {
    this.logger.log('Warming up dashboard cache...');
    
    try {
      await Promise.all([
        this.getOverallStats(),
        this.getFinancialSummary(new Date().getFullYear()),
        this.getActivitySummary('weekly')
      ]);
      
      this.logger.log('Dashboard cache warmed up successfully');
    } catch (error) {
      this.logger.warn('Failed to warm up cache', error);
    }
  }
}
```

## Summary

Dashboard Statistics API menyediakan backend endpoints yang efisien untuk menampilkan statistik real-time pada dashboard WargaNet. Dengan menggunakan Redis caching, database aggregation queries, dan role-based access control, API ini memastikan performa optimal dan keamanan data.

Key features:
- Three main endpoints: overall stats, financial summary, activity summary
- Redis caching dengan 5-minute TTL untuk performa optimal
- Database query optimization dengan aggregation dan parallel queries
- Role-based access control untuk data privacy
- Comprehensive error handling dan fallback strategies
- Frontend integration dengan loading states dan error handling
- Property-based testing untuk correctness validation

