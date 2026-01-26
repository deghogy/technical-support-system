import { z } from 'zod'

/**
 * Request submission schema - validates incoming visit request
 */
export const createSiteVisitRequestSchema = z.object({
  requester_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters'),
  requester_email: z
    .string()
    .email('Invalid email address')
    .toLowerCase(),
  site_location: z
    .string()
    .trim()
    .min(5, 'Location must be at least 5 characters')
    .max(500, 'Location must not exceed 500 characters'),
  problem_desc: z
    .string()
    .trim()
    .min(10, 'Problem description must be at least 10 characters')
    .max(2000, 'Problem description must not exceed 2000 characters'),
  requested_date: z
    .string()
    .refine((date) => {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime()) && parsed >= new Date()
    }, 'Requested date must be in the future'),
  estimated_hours: z
    .number()
    .int('Estimated hours must be a whole number')
    .min(1, 'Estimated hours must be at least 1')
    .max(24, 'Estimated hours must not exceed 24'),
})

export type CreateSiteVisitRequest = z.infer<typeof createSiteVisitRequestSchema>

/**
 * Approval schema - validates admin approval submission
 */
export const approvalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  scheduled_date: z.string().optional(),
  duration_hours: z.coerce.number().int().min(1).optional(),
})

/**
 * Visit recording schema - validates technician visit completion
 */
export const visitRecordingSchema = z.object({
  actual_start_time: z.string(),
  actual_end_time: z.string(),
  technician_notes: z.string().optional(),
})

/**
 * Visit confirmation schema - validates customer confirmation
 */
export const visitConfirmationSchema = z.object({
  customer_notes: z.string().optional(),
})
