import { z } from 'zod';

const password = z.string().min(12, 'Password must be at least 12 characters').max(128).refine(
  (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value),
  'Password must include uppercase, lowercase, number, and symbol',
);

export const loginSchema = z.object({ employeeId: z.string().trim().min(1).max(32).transform((value) => value.toUpperCase()), password });
export const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(160), mobile: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid mobile number'),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), dateOfBirth: z.string().date().optional(),
  currentAddress: z.string().trim().min(5).max(1_000), permanentAddress: z.string().trim().min(5).max(1_000), education: z.string().trim().min(2).max(1_000), priorExperience: z.string().trim().min(2).max(2_000), password,
});
export const reviewRegistrationSchema = z.object({ action: z.enum(['APPROVE', 'REJECT']), departmentId: z.string().uuid().optional(), designationId: z.string().uuid().optional(), roleIds: z.array(z.string().uuid()).min(1).max(8).optional(), rejectionReason: z.string().trim().min(3).max(1_000).optional() }).superRefine((value, context) => {
  if (value.action === 'APPROVE' && !value.roleIds) context.addIssue({ code: 'custom', message: 'At least one role is required for approval', path: ['roleIds'] });
  if (value.action === 'REJECT' && !value.rejectionReason) context.addIssue({ code: 'custom', message: 'A rejection reason is required', path: ['rejectionReason'] });
});
