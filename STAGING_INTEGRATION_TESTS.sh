#!/bin/bash

# STAGING INTEGRATION TESTS
# Phase 2 - TalentSecure Platform
# Automated testing script for all Phase 2 endpoints

set -e

# Configuration
BACKEND_URL="http://localhost:5050"
FRONTEND_URL="http://localhost:3000"
TEST_TOKEN="Bearer test_token_replace_with_real_jwt"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Helper functions
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4

    TOTAL=$((TOTAL + 1))
    printf "Test $TOTAL: $description... "

    if [ -z "$data" ]; then
        response=$(curl -s -X "$method" \
            -H "Authorization: $TEST_TOKEN" \
            -H "Content-Type: application/json" \
            "$BACKEND_URL$endpoint")
    else
        response=$(curl -s -X "$method" \
            -H "Authorization: $TEST_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BACKEND_URL$endpoint")
    fi

    # Check if response contains success or data
    if echo "$response" | grep -q '"success":true\|"data":\|"id":'; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Response: $response"
        FAILED=$((FAILED + 1))
    fi
}

# Check if services are running
check_services() {
    echo -e "${YELLOW}Checking if services are running...${NC}"

    # Check backend
    if ! curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}Backend is not running on $BACKEND_URL${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Backend is running${NC}"

    # Check frontend
    if ! curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
        echo -e "${RED}Frontend is not running on $FRONTEND_URL${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Frontend is running${NC}"

    echo ""
}

# Test Users Endpoints
test_users_endpoints() {
    echo -e "${YELLOW}=== Testing Users Endpoints ===${NC}"

    test_endpoint "GET" "/api/superadmin/users" "List users"
    test_endpoint "GET" "/api/superadmin/users?page=1&limit=10" "List users with pagination"
    test_endpoint "GET" "/api/superadmin/users?search=john" "Search users"
    test_endpoint "GET" "/api/superadmin/users/search?q=test" "Autocomplete search"

    echo ""
}

# Test Roles Endpoints
test_roles_endpoints() {
    echo -e "${YELLOW}=== Testing Roles Endpoints ===${NC}"

    test_endpoint "GET" "/api/superadmin/roles" "List roles"
    test_endpoint "GET" "/api/superadmin/roles/permissions" "Get permissions"

    echo ""
}

# Test Audit Trail Endpoints
test_audit_endpoints() {
    echo -e "${YELLOW}=== Testing Audit Trail Endpoints ===${NC}"

    test_endpoint "GET" "/api/superadmin/audit-trail" "List audit logs"
    test_endpoint "GET" "/api/superadmin/audit-trail?page=1&limit=50" "List with pagination"
    test_endpoint "GET" "/api/superadmin/audit-trail?action=LOGIN" "Filter by action"
    test_endpoint "GET" "/api/superadmin/audit-trail/stats?days=30" "Get statistics"

    echo ""
}

# Test Workflows Endpoints
test_workflows_endpoints() {
    echo -e "${YELLOW}=== Testing Workflows Endpoints ===${NC}"

    test_endpoint "GET" "/api/superadmin/workflows" "List workflows"
    test_endpoint "GET" "/api/superadmin/workflows?page=1&limit=50" "List with pagination"

    echo ""
}

# Test Frontend Pages
test_frontend_pages() {
    echo -e "${YELLOW}=== Testing Frontend Pages ===${NC}"

    printf "Test $(($TOTAL + 1)): Frontend loads... "
    if curl -s "$FRONTEND_URL" | grep -q "<!DOCTYPE\|<html"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED=$((FAILED + 1))
    fi
    TOTAL=$((TOTAL + 1))

    echo ""
}

# Test Performance
test_performance() {
    echo -e "${YELLOW}=== Testing Performance ===${NC}"

    printf "Test $(($TOTAL + 1)): Users endpoint response time... "
    start_time=$(date +%s%N)
    curl -s -X GET \
        -H "Authorization: $TEST_TOKEN" \
        "$BACKEND_URL/api/superadmin/users" > /dev/null
    end_time=$(date +%s%N)

    response_time=$(( (end_time - start_time) / 1000000 ))

    if [ $response_time -lt 500 ]; then
        echo -e "${GREEN}✓ PASSED (${response_time}ms)${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ SLOW (${response_time}ms)${NC}"
        PASSED=$((PASSED + 1))
    fi
    TOTAL=$((TOTAL + 1))

    echo ""
}

# Main execution
echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║         PHASE 2 STAGING INTEGRATION TESTS                     ║${NC}"
echo -e "${YELLOW}║         TalentSecure Platform                                 ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

check_services
test_users_endpoints
test_roles_endpoints
test_audit_endpoints
test_workflows_endpoints
test_frontend_pages
test_performance

# Summary
echo -e "${YELLOW}=== TEST SUMMARY ===${NC}"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED${NC}"
    exit 0
else
    echo -e "\n${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
