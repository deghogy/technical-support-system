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
    .min(1, 'Problem description is required')
    .max(2000, 'Problem description must not exceed 2000 characters'),
  requested_date: z
    .string()
    .refine((date) => {
      const parsed = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return !isNaN(parsed.getTime()) && parsed > today
    }, 'Requested date must be tomorrow or later'),
  estimated_hours: z
    .number()
    .int('Estimated hours must be a whole number')
    .min(0, 'Estimated hours must be at least 0')
    .max(999, 'Estimated hours must not exceed 999')
    .optional(),
  support_type: z
    .enum(['remote', 'onsite'], {
      errorMap: () => ({ message: 'Support type must be remote or onsite' }),
    }),
})

export type CreateSiteVisitRequest = z.infer<typeof createSiteVisitRequestSchema>

/**
 * Approval schema - validates admin approval submission
 */
export const approvalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  scheduled_date: z.string().optional().nullable(),
  duration_hours: z.coerce.number().int().min(1).max(24).optional().nullable(),
}).refine(
  (data) => {
    // If approving, scheduled_date is required
    if (data.status === 'approved') {
      return data.scheduled_date !== null && data.scheduled_date !== undefined && data.scheduled_date !== ''
    }
    return true
  },
  { message: 'Approved requests must have a scheduled_date' }
)

/**
 * Visit recording schema - validates technician visit completion
 */
export const visitRecordingSchema = z.object({
  actual_start_time: z.string().refine(
    (date) => !isNaN(new Date(date).getTime()),
    'Invalid start time format'
  ),
  actual_end_time: z.string().refine(
    (date) => !isNaN(new Date(date).getTime()),
    'Invalid end time format'
  ),
  technician_notes: z.string().max(5000, 'Notes must not exceed 5000 characters').optional(),
}).refine(
  (data) => new Date(data.actual_end_time) > new Date(data.actual_start_time),
  { message: 'End time must be after start time' }
)

/**
 * Visit confirmation schema - validates customer confirmation
 */
export const visitConfirmationSchema = z.object({
  customer_notes: z.string().max(5000, 'Notes must not exceed 5000 characters').optional(),
})
