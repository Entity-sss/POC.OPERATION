import { z } from 'zod';

// ==========================================
// CLIENT SCHEMAS
// ==========================================

export const createClientSchema = z.object({
  name: z.string().trim().min(1, 'Client contact name is required').max(200),
  companyName: z.string().trim().min(1, 'Company name is required').max(300),
  email: z.string().trim().max(254).optional().nullable()
    .transform((v) => v && v.length > 0 ? v : null),
  phone: z.string().trim().max(20).optional().nullable()
    .transform((v) => v && v.length > 0 ? v : null),
  status: z.enum(['ACTIVE', 'LEAD', 'INACTIVE']).optional().default('ACTIVE'),
  assignedEmployeeId: z.string().trim()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid employee ID')
    .optional().nullable(),
});

// ==========================================
// INVOICE SCHEMAS
// ==========================================

export const createInvoiceSchema = z.object({
  clientId: z.string().trim()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid client ID'),
  projectId: z.string().trim()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid project ID')
    .optional().nullable(),
  amount: z.number().int().positive('Invoice amount must be a positive integer (paise/INR)'),
  issueDate: z.number().int().positive('Issue date timestamp is required'),
  dueDate: z.number().int().positive('Due date timestamp is required'),
  notes: z.string().trim().max(2000).optional().nullable(),
}).refine((data) => data.dueDate >= data.issueDate, {
  message: 'Due date must not be before issue date',
  path: ['dueDate'],
});

// ==========================================
// PAYMENT SCHEMAS
// ==========================================

export const recordPaymentSchema = z.object({
  invoiceId: z.string().trim()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid invoice ID'),
  amount: z.number().int().positive('Payment amount must be a positive integer'),
  paymentDate: z.number().int().positive('Payment date timestamp is required'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER']).optional().default('BANK_TRANSFER'),
  referenceNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

// ==========================================
// PROJECT SCHEMAS
// ==========================================

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').max(300),
  clientId: z.string().trim()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid client ID')
    .optional().nullable(),
  vendorId: z.string().trim()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid vendor ID')
    .optional().nullable(),
  budget: z.number().int().min(0, 'Budget cannot be negative').optional().default(0),
  startDate: z.number().int().positive().optional().nullable(),
  targetDate: z.number().int().positive().optional().nullable(),
});

export const updateProjectStatusSchema = z.object({
  status: z.enum([
    'FABRICATION', 'DISPATCH', 'SETUP', 'LIVE',
    'DISMANTLE', 'CLOSURE_PACK', 'COMPLETED', 'CANCELLED',
  ], { message: 'Invalid project status' }),
});

// ==========================================
// VENDOR SCHEMAS
// ==========================================

export const createVendorSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name is required').max(200),
  category: z.enum([
    'FABRICATION', 'LOGISTICS', 'PRINTING', 'EQUIPMENT',
    'VENUE', 'CREATIVE', 'OTHER',
  ], { message: 'Invalid vendor category' }),
  contactPerson: z.string().trim().min(1, 'Contact person is required').max(200),
  phone: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().max(254).optional().nullable(),
  location: z.string().trim().max(500).optional().nullable(),
});

// ==========================================
// TASK MUTATION SCHEMAS
// ==========================================

export const updateTaskExecutionSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'COMPLETED']).optional(),
  evidence: z.string().trim().max(2000).optional(),
  evidenceType: z.enum(['DOCUMENT', 'EMAIL', 'NOTE', 'LINK']).optional(),
  makerNotes: z.string().trim().max(2000).optional(),
});

export const requestTaskDelaySchema = z.object({
  requestedDueDate: z.number().int().positive('Requested due date is required'),
  reason: z.string().trim().min(3, 'A clear reason for the delay is required').max(2000),
  businessImpact: z.string().trim().max(2000).optional().nullable(),
});

// ==========================================
// DAILY WORK REPORT SCHEMAS
// ==========================================

export const saveDailyWorkReportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Report date must be YYYY-MM-DD format'),
  status: z.enum(['DRAFT', 'SUBMITTED']),
  callsCount: z.number().int().min(0).optional().default(0),
  meetingsCount: z.number().int().min(0).optional().default(0),
  followUpsCount: z.number().int().min(0).optional().default(0),
  dealsSummary: z.string().trim().max(2000).optional().nullable(),
  completedTasksSummary: z.string().trim().max(2000).optional().nullable(),
  pendingTasksSummary: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
});

// ==========================================
// MANAGER REVIEW SCHEMAS
// ==========================================

export const verifyTaskSchema = z.object({
  approved: z.boolean(),
  checkerNotes: z.string().trim().max(2000).optional().nullable(),
});

export const reviewDailyReportSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().trim().min(3).max(2000).optional().nullable(),
}).refine((data) => {
  if (data.action === 'REJECT' && (!data.rejectionReason || data.rejectionReason.length < 3)) {
    return false;
  }
  return true;
}, { message: 'A clear rejection reason is required', path: ['rejectionReason'] });

export const reviewDelayRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reviewRemarks: z.string().trim().max(2000).optional().nullable(),
});

// ==========================================
// TASK ASSIGNMENT SCHEMA
// ==========================================

export const assignTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(300),
  description: z.string().trim().max(2000).optional(),
  assignedToEmployeeId: z.string().trim()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid employee ID'),
  clientId: z.string().trim()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid client ID')
    .optional(),
  priority: z.enum(['P1', 'P2', 'P3']).optional().default('P2'),
  dueDate: z.number().int().positive('Due date is required'),
});
