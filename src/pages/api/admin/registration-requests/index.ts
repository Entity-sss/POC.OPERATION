import type { APIRoute } from 'astro';
import { desc } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { createDb } from '@/lib/db';
import { employeeRegistrationRequests } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/service';
import { apiError, jsonResponse } from '@/lib/auth/http';

export const prerender = false;
export const GET: APIRoute = async (context) => {
  try {
    const db = createDb(env.poc_operation_db);
    await requirePermission(db, context.locals.auth, 'employee.approve_registration');
    const requests = await db.select({
      id: employeeRegistrationRequests.id,
      fullName: employeeRegistrationRequests.fullName,
      mobile: employeeRegistrationRequests.mobile,
      email: employeeRegistrationRequests.email,
      dateOfBirth: employeeRegistrationRequests.dateOfBirth,
      currentAddress: employeeRegistrationRequests.currentAddress,
      permanentAddress: employeeRegistrationRequests.permanentAddress,
      education: employeeRegistrationRequests.education,
      priorExperience: employeeRegistrationRequests.priorExperience,
      status: employeeRegistrationRequests.status,
      createdEmployeeId: employeeRegistrationRequests.createdEmployeeId,
      createdAt: employeeRegistrationRequests.createdAt,
      reviewedAt: employeeRegistrationRequests.reviewedAt,
      rejectionReason: employeeRegistrationRequests.rejectionReason,
    }).from(employeeRegistrationRequests).orderBy(desc(employeeRegistrationRequests.createdAt));
    return jsonResponse({ requests });
  } catch (error) { return apiError(error); }
};
