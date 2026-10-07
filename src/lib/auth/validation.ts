import { z } from 'zod';

export const loginSchema = z.object({
  employeeId: z.string().trim().min(1, 'Employee ID or email is required').max(128).transform((value) => value.toUpperCase()),
  password: z.string().min(1, 'Password is required').max(128),
});

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(160),
  mobile: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid mobile number with country code'),
  email: z.email({ message: 'Enter a valid email address' }).max(254).transform((value) => value.toLowerCase()),
  dateOfBirth: z.string().optional().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), 'Enter a valid date (YYYY-MM-DD)').transform((val) => (val && val.trim() ? val.trim() : undefined)),
  currentAddress: z.string().trim().min(5, 'Current address is required').max(1_000),
  permanentAddress: z.string().trim().min(5, 'Permanent address is required').max(1_000),
  education: z.string().trim().min(2, 'Education credential is required').max(1_000),
  priorExperience: z.string().trim().min(2, 'Prior operational experience summary is required').max(2_000),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const firstAdminSchema = registrationSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const reviewRegistrationSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  departmentId: z.string().trim().optional().nullable(),
  designationId: z.string().trim().optional().nullable(),
  roleIds: z.array(z.string().trim()).min(1).max(8).optional(),
  initialPassword: z.string().trim().min(6, 'Initial password must be at least 6 characters').max(128).optional(),
  rejectionReason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters').max(1_000).optional(),
}).superRefine((value, context) => {
  if (value.action === 'APPROVE') {
    if (!value.roleIds || value.roleIds.length === 0) {
      context.addIssue({ code: 'custom', message: 'At least one role is required for approval', path: ['roleIds'] });
    }
    if (!value.initialPassword || value.initialPassword.length < 6) {
      context.addIssue({ code: 'custom', message: 'Initial password of at least 6 characters is required for approval', path: ['initialPassword'] });
    }
  }
  if (value.action === 'REJECT' && !value.rejectionReason) {
    context.addIssue({ code: 'custom', message: 'A rejection reason is required', path: ['rejectionReason'] });
  }
});

export const updateEmployeeSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  mobile: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid mobile number').optional(),
  departmentId: z.string().trim().optional().nullable(),
  designationId: z.string().trim().optional().nullable(),
  currentAddress: z.string().trim().min(5).max(1_000).optional(),
  permanentAddress: z.string().trim().min(5).max(1_000).optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string().trim()).min(1).max(8).optional(),
});
