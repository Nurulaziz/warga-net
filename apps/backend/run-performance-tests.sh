#!/bin/bash

# Performance Testing Script
# Runs all performance tests dan generate report

set -e

echo "🚀 WargaNet Performance Testing Suite"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
echo "📋 Checking prerequisites..."

# Check PostgreSQL
if ! docker ps | grep -q postgres; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "   Run: docker-compose up -d postgres"
    exit 1
fi
echo -e "${GREEN}✓${NC} PostgreSQL is running"

# Check Redis
if ! docker ps | grep -q redis; then
    echo -e "${RED}❌ Redis is not running${NC}"
    echo "   Run: docker-compose up -d redis"
    exit 1
fi
echo -e "${GREEN}✓${NC} Redis is running"

# Check if backend is running
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${YELLOW}⚠${NC}  Backend is not running"
    echo "   Starting backend..."
    pnpm dev &
    BACKEND_PID=$!
    sleep 5
else
    echo -e "${GREEN}✓${NC} Backend is running"
fi

echo ""
echo "======================================"
echo "1️⃣  Database Query Performance Tests"
echo "======================================"
echo ""

pnpm test performance-tests/database-query.spec.ts --run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database query tests passed"
else
    echo -e "${RED}✗${NC} Database query tests failed"
    exit 1
fi

echo ""
echo "======================================"
echo "2️⃣  API Response Time Tests"
echo "======================================"
echo ""

pnpm test performance-tests/api-response-time.spec.ts --run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} API response time tests passed"
else
    echo -e "${RED}✗${NC} API response time tests failed"
    exit 1
fi

echo ""
echo "======================================"
echo "3️⃣  Load Test Data Generation"
echo "======================================"
echo ""

echo "Generating load test data..."
pnpm tsx performance-tests/load-test.ts generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Load test data generated"
else
    echo -e "${RED}✗${NC} Load test data generation failed"
    exit 1
fi

echo ""
echo "Running tests with load data..."
pnpm test performance-tests/database-query.spec.ts --run

echo ""
echo "Cleaning up load test data..."
pnpm tsx performance-tests/load-test.ts cleanup

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Load test data cleaned up"
else
    echo -e "${YELLOW}⚠${NC}  Load test data cleanup failed (manual cleanup may be needed)"
fi

echo ""
echo "======================================"
echo "📊 Performance Test Summary"
echo "======================================"
echo ""
echo -e "${GREEN}✓${NC} All performance tests completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review test results above"
echo "2. Run Lighthouse audit for frontend (see PERFORMANCE-TESTING.md)"
echo "3. Check for any performance warnings"
echo "4. Optimize if needed"
echo ""

# Kill backend if we started it
if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID
fi

exit 0
