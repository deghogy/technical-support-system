-- Performance Optimization Indexes
-- This migration adds indexes to speed up common queries

-- ============================================
-- site_visit_requests table indexes
-- ============================================

-- Index for status filtering (pending, approved, etc.) - heavily used
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_status
ON site_visit_requests(status);

-- Index for requester email lookups (track request page)
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_requester_email
ON site_visit_requests(requester_email);

-- Index for customer_id (authenticated user lookups)
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_customer_id
ON site_visit_requests(customer_id);

-- Index for visit status (confirmed, pending, etc.)
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_visit_status
ON site_visit_requests(visit_status);

-- Index for scheduled_date (for finding upcoming visits)
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_scheduled_date
ON site_visit_requests(scheduled_date)
WHERE scheduled_date IS NOT NULL;

-- Index for actual_start_time (for finding recorded/unrecorded visits)
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_actual_start_time
ON site_visit_requests(actual_start_time)
WHERE actual_start_time IS NOT NULL;

-- Composite index for scheduled visits query (status='approved' + scheduled_date IS NOT NULL + actual_start_time IS NULL)
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_scheduled_visits
ON site_visit_requests(status, scheduled_date, actual_start_time)
WHERE status = 'approved' AND scheduled_date IS NOT NULL AND actual_start_time IS NULL;

-- Composite index for recorded visits query (status='approved' + actual_start_time IS NOT NULL + customer_confirmed_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_recorded_visits
ON site_visit_requests(status, actual_start_time, customer_confirmed_at)
WHERE status = 'approved' AND actual_start_time IS NOT NULL AND customer_confirmed_at IS NULL;

-- Index for created_at ordering (most recent first)
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_created_at_desc
ON site_visit_requests(created_at DESC);

-- ============================================
-- profiles table indexes
-- ============================================

-- Index for role filtering (admin, approver, customer lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email);

-- ============================================
-- customer_quotas table indexes
-- ============================================

-- Index for customer email lookups (quota checks)
CREATE INDEX IF NOT EXISTS idx_customer_quotas_email
ON customer_quotas(customer_email);

-- Index for used_hours (for sorting quota dashboard)
CREATE INDEX IF NOT EXISTS idx_customer_quotas_used_hours
ON customer_quotas(used_hours DESC);

-- ============================================
-- customer_locations table indexes
-- ============================================

-- Index for customer_id lookups (RLS and filtering)
CREATE INDEX IF NOT EXISTS idx_customer_locations_customer_id
ON customer_locations(customer_id);

-- Unique constraint/index for customer + location combo
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_locations_unique
ON customer_locations(customer_id, location_name);

-- ============================================
-- quota_logs table indexes
-- ============================================

-- Index for quota_id foreign key lookups
CREATE INDEX IF NOT EXISTS idx_quota_logs_quota_id
ON quota_logs(quota_id);

-- Index for created_at ordering in logs
CREATE INDEX IF NOT EXISTS idx_quota_logs_created_at_desc
ON quota_logs(created_at DESC);

-- Add comment explaining the migration
COMMENT ON INDEX idx_site_visit_requests_status IS 'Optimizes dashboard stats and pending requests queries';
COMMENT ON INDEX idx_site_visit_requests_requester_email IS 'Optimizes track request page lookups';
COMMENT ON INDEX idx_site_visit_requests_scheduled_visits IS 'Optimizes scheduled visits tab in admin';
COMMENT ON INDEX idx_site_visit_requests_recorded_visits IS 'Optimizes recorded visits tab in admin';
