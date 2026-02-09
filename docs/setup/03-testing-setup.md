# ✅ Task 2.4: Property-Based Testing Setup

## Summary

Property-based testing dengan fast-check telah diimplementasikan untuk memvalidasi database constraints.

## What Was Implemented

### 1. ✅ Install fast-check

```bash
pnpm add -D fast-check --filter @warganet/backend
```

### 2. ✅ Configure Jest

Updated `jest.config.js` untuk include prisma directory dalam test paths.

### 3. ✅ Implement Property Tests

**File**: `apps/backend/prisma/uniqueness-constraints.spec.ts`

**Property 17: Uniqueness Constraint untuk Nomor Telepon dan KTP**

Validates Requirements: 6.9, 7.5, 8.4, 15.3

**Test Cases:**

1. **User Phone Number Uniqueness - Create**
   - Property: Duplicate phone numbers harus ditolak pada create
   - Iterations: 20
   - Status: ✅ PASSED

2. **User Phone Number Uniqueness - Update**
   - Property: Duplicate phone numbers harus ditolak pada update
   - Iterations: 20
   - Status: ✅ PASSED

3. **Resident ID Number Uniqueness - Create**
   - Property: Duplicate ID numbers harus ditolak pada create
   - Iterations: 20
   - Status: ✅ PASSED

4. **Resident ID Number Uniqueness - Update**
   - Property: Duplicate ID numbers harus ditolak pada update
   - Iterations: 20
   - Status: ✅ PASSED

5. **Soft Delete Behavior**
   - Property: Phone number reuse setelah soft delete
   - Iterations: 10
   - Status: ✅ PASSED

## Test Results

```
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Time:        3.809 s
```

## Property-Based Testing Strategy

### Why Property-Based Testing?

Property-based testing memverifikasi bahwa properti universal berlaku untuk semua input yang valid, bukan hanya contoh spesifik.

**Advantages:**

- Menemukan edge cases yang tidak terpikirkan
- Lebih comprehensive daripada example-based tests
- Self-documenting (properti = spesifikasi formal)
- Confidence tinggi dalam correctness

### Testing Framework

**fast-check** - Property-based testing library untuk JavaScript/TypeScript

**Features:**

- Arbitrary generators untuk berbagai tipe data
- Shrinking otomatis untuk counterexamples
- Configurable iterations
- Integration dengan Jest

### Test Structure

```typescript
import * as fc from 'fast-check';

describe('Property Test', () => {
  it('should satisfy property', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer(), // Generator
        async (value) => {
          // Test logic
          expect(result).toBe(expected);
        },
      ),
      { numRuns: 20 }, // Iterations
    );
  });
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test uniqueness-constraints.spec.ts

# Run with coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

## Next Steps

Property-based tests akan ditambahkan untuk:

- OTP generation dan validation
- JWT token management
- Rate limiting
- Permission checking
- Cascade delete behavior

## Resources

- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)
- [Jest Integration](https://fast-check.dev/docs/advanced/jest/)

Testing setup complete! 🎉
