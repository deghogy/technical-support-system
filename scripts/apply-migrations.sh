#!/bin/bash
# Supabase Migration Script
# This script applies migrations using the Supabase REST API

SUPABASE_URL="https://xcuqyeqzldkvcuerqwpf.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdXF5ZXF6bGRrdmN1ZXJxd3BmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzkzOTU3OCwiZXhwIjoyMDgzNTE1NTc4fQ.3m-e8GoygrB2UpEMHdUTap3x2T_bYaZgLPvW4W8JvsM"

echo "🚀 Applying Supabase migrations..."
echo ""

# Migration 1: Add support_type column
echo "⏳ Migration 1: Adding support_type column..."

# Try to query information_schema to check if column exists
COLUMN_EXISTS=$(curl -s -X GET "$SUPABASE_URL/rest/v1/site_visit_requests?select=support_type&limit=0" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" 2>&1)

if echo "$COLUMN_EXISTS" | grep -q "support_type"; then
    echo "✅ support_type column already exists"
else
    echo "⚠️  support_type column needs to be added"
    echo ""
    echo "📋 Please run this SQL in Supabase SQL Editor:"
    echo "   URL: https://supabase.com/dashboard/project/xcuqyeqzldkvcuerqwpf/sql/new"
    echo ""
    echo "-- Migration 1: Add support_type column"
    echo "ALTER TABLE site_visit_requests"
    echo "ADD COLUMN IF NOT EXISTS support_type VARCHAR(10) NOT NULL DEFAULT 'onsite';"
    echo ""
    echo "-- Add constraint"
    echo "ALTER TABLE site_visit_requests"
    echo "DROP CONSTRAINT IF EXISTS check_support_type;"
    echo ""
    echo "ALTER TABLE site_visit_requests"
    echo "ADD CONSTRAINT check_support_type"
    echo "CHECK (support_type IN ('remote', 'onsite'));"
    echo ""
    echo "-- Create index"
    echo "CREATE INDEX IF NOT EXISTS idx_site_visit_requests_support_type"
    echo "ON site_visit_requests(support_type);"
fi

echo ""

# Migration 2: Make estimated_hours nullable
echo "⏳ Migration 2: Checking estimated_hours nullable status..."

# Try to insert a test record without estimated_hours
TEST_INSERT=$(curl -s -X POST "$SUPABASE_URL/rest/v1/site_visit_requests" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "requester_name": "_test_migration_",
    "requester_email": "test@migration.local",
    "site_location": "_test_",
    "problem_desc": "_test_",
    "requested_date": "2026-01-30",
    "support_type": "onsite"
  }' 2>&1)

# Clean up test record
curl -s -X DELETE "$SUPABASE_URL/rest/v1/site_visit_requests?requester_name=eq._test_migration_" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" > /dev/null 2>&1

if echo "$TEST_INSERT" | grep -q "estimated_hours"; then
    echo "⚠️  estimated_hours is NOT nullable"
    echo ""
    echo "📋 Please run this SQL in Supabase SQL Editor:"
    echo "-- Migration 2: Make estimated_hours nullable"
    echo "ALTER TABLE site_visit_requests"
    echo "ALTER COLUMN estimated_hours DROP NOT NULL;"
else
    echo "✅ estimated_hours is nullable (insert without it succeeded)"
fi

echo ""
echo "✨ Migration check completed!"
