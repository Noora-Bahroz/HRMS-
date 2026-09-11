import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/http";

export function createRequisition(tenantId: string, data: { title: string; departmentId?: string; openings?: number; description?: string }) {
  return prisma.jobRequisition.create({
    data: {
      tenantId,
      title: data.title,
      departmentId: data.departmentId,
      openings: data.openings ?? 1,
      description: data.description,
      status: "draft",
    },
  });
}

export function listRequisitions(tenantId: string, status?: string) {
  return prisma.jobRequisition.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    include: { _count: { select: { postings: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateRequisition(tenantId: string, id: string, data: { title?: string; departmentId?: string; openings?: number; description?: string; status?: string }) {
  const req = await prisma.jobRequisition.findFirst({ where: { id, tenantId } });
  if (!req) throw ApiError.notFound("Requisition not found");
  return prisma.jobRequisition.update({ where: { id }, data });
}

export async function createPosting(tenantId: string, data: { requisitionId: string; title: string; location?: string; dueDate?: string }) {
  const req = await prisma.jobRequisition.findFirst({ where: { id: data.requisitionId, tenantId } });
  if (!req) throw ApiError.notFound("Requisition not found");
  return prisma.jobPosting.create({
    data: {
      requisitionId: data.requisitionId,
      title: data.title,
      location: data.location,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      isActive: true,
    },
  });
}

export function listPostings(tenantId: string) {
  return prisma.jobPosting.findMany({
    where: { isActive: true },
    include: {
      requisition: { select: { tenantId: true, title: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { postedDate: "desc" },
  }).then((rows) => rows.filter((p) => p.requisition.tenantId === tenantId));
}

export async function createCandidate(tenantId: string, data: { firstName: string; lastName: string; email: string; phone?: string }) {
  return prisma.candidate.create({
    data: { tenantId, ...data },
  });
}

export function listCandidates(tenantId: string, search?: string) {
  const where: Record<string, unknown> = { tenantId, deletedAt: null };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  return prisma.candidate.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function getCandidateDetail(tenantId: string, id: string) {
  const candidate = await prisma.candidate.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      applications: {
        include: {
          jobPosting: { include: { requisition: true } },
          interviews: { include: { feedback: true } },
          offer: true,
        },
      },
    },
  });
  if (!candidate) throw ApiError.notFound("Candidate not found");
  return candidate;
}

export async function updateCandidate(tenantId: string, id: string, data: { firstName?: string; lastName?: string; email?: string; phone?: string }) {
  const candidate = await prisma.candidate.findFirst({ where: { id, tenantId, deletedAt: null } });
  if (!candidate) throw ApiError.notFound("Candidate not found");
  return prisma.candidate.update({ where: { id }, data });
}

export function createApplication(data: { jobPostingId: string; candidateId: string }) {
  return prisma.application.create({
    data: {
      jobPostingId: data.jobPostingId,
      candidateId: data.candidateId,
      status: "applied",
      stage: 1,
    },
  });
}

export function listApplications(tenantId: string) {
  return prisma.application.findMany({
    orderBy: { appliedAt: "desc" },
    include: {
      jobPosting: { include: { requisition: { select: { tenantId: true, title: true } } } },
      candidate: true,
      interviews: true,
      offer: true,
    },
  }).then((rows) => rows.filter((a) => a.jobPosting.requisition.tenantId === tenantId));
}

export function moveApplication(id: string, status: string, stage?: number) {
  return prisma.application.update({
    where: { id },
    data: { status, ...(stage !== undefined ? { stage } : {}) },
  });
}

export async function createInterview(tenantId: string, data: { applicationId: string; scheduledAt: string; interviewerId?: string; mode?: string }) {
  const app = await prisma.application.findFirst({
    where: { id: data.applicationId },
    include: { jobPosting: { include: { requisition: { select: { tenantId: true } } } } },
  });
  if (!app || app.jobPosting.requisition.tenantId !== tenantId) {
    throw ApiError.notFound("Application not found");
  }
  return prisma.interview.create({
    data: {
      applicationId: data.applicationId,
      scheduledAt: new Date(data.scheduledAt),
      interviewerId: data.interviewerId,
      mode: data.mode,
      status: "scheduled",
    },
  });
}

export function addInterviewFeedback(data: { interviewId: string; interviewerId: string; rating?: number; comment?: string; status?: string }) {
  return prisma.interviewFeedback.create({ data });
}

export function listInterviews(tenantId: string) {
  return prisma.interview.findMany({
    orderBy: { scheduledAt: "desc" },
    include: {
      application: {
        include: {
          jobPosting: { include: { requisition: { select: { tenantId: true } } } },
          candidate: true,
        },
      },
      feedback: true,
    },
  }).then((rows) => rows.filter((i) => i.application.jobPosting.requisition.tenantId === tenantId));
}

export function createOffer(data: { applicationId: string; salary?: number; startDate?: string; notes?: string }) {
  return prisma.jobOffer.create({
    data: {
      applicationId: data.applicationId,
      salary: data.salary,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      notes: data.notes,
      status: "pending",
    },
  });
}

export function listOffers(tenantId: string) {
  return prisma.jobOffer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        include: {
          candidate: true,
          jobPosting: { include: { requisition: { select: { tenantId: true, title: true } } } },
        },
      },
    },
  }).then((rows) => rows.filter((o) => o.application.jobPosting.requisition.tenantId === tenantId));
}

export async function updateOffer(tenantId: string, id: string, data: { status?: string; salary?: number; notes?: string }) {
  const offer = await prisma.jobOffer.findFirst({
    where: { id },
    include: { application: { include: { jobPosting: { include: { requisition: { select: { tenantId: true } } } } } } },
  });
  if (!offer || offer.application.jobPosting.requisition.tenantId !== tenantId) {
    throw ApiError.notFound("Offer not found");
  }
  return prisma.jobOffer.update({ where: { id }, data });
}

export async function convertToEmployee(tenantId: string, offerId: string, data: { departmentId?: string; teamId?: string; designationId?: string }) {
  const offer = await prisma.jobOffer.findFirst({
    where: { id: offerId, status: "accepted" },
    include: {
      application: {
        include: {
          candidate: true,
          jobPosting: { include: { requisition: { select: { tenantId: true } } } },
        },
      },
    },
  });
  if (!offer || offer.application.jobPosting.requisition.tenantId !== tenantId) {
    throw ApiError.notFound("Accepted offer not found");
  }

  const candidate = offer.application.candidate;
  const existingEmp = await prisma.employee.findFirst({
    where: { tenantId, email: candidate.email },
  });
  if (existingEmp) throw ApiError.conflict("Employee already exists for this candidate");

  const count = await prisma.employee.count({ where: { tenantId } });
  const employee = await prisma.employee.create({
    data: {
      tenantId,
      companyId: tenantId,
      employeeNumber: `EMP-${String(count + 1).padStart(4, "0")}`,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      departmentId: data.departmentId,
      teamId: data.teamId,
      designationId: data.designationId,
      employmentStatus: "active",
      dateOfJoining: offer.startDate ?? new Date(),
    },
  });

  await prisma.application.update({
    where: { id: offer.applicationId },
    data: { status: "hired" },
  });

  return employee;
}

export async function getRecruitmentStats(tenantId: string) {
  const [
    openRequisitions,
    totalRequisitions,
    activePostings,
    totalCandidates,
    applicationsByStatus,
    upcomingInterviews,
    pendingFeedback,
    totalOffers,
    acceptedOffers,
    hiredCount,
  ] = await Promise.all([
    prisma.jobRequisition.count({ where: { tenantId, status: "open" } }),
    prisma.jobRequisition.count({ where: { tenantId } }),
    prisma.jobPosting.findMany({
      where: { isActive: true },
      include: { requisition: { select: { tenantId: true } } },
    }).then((rows) => rows.filter((p) => p.requisition.tenantId === tenantId).length),
    prisma.candidate.count({ where: { tenantId, deletedAt: null } }),
    prisma.application.findMany({
      include: { jobPosting: { include: { requisition: { select: { tenantId: true } } } } },
    }).then((rows) => {
      const filtered = rows.filter((a) => a.jobPosting.requisition.tenantId === tenantId);
      const byStatus: Record<string, number> = {};
      for (const a of filtered) {
        byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      }
      return byStatus;
    }),
    prisma.interview.findMany({
      where: { scheduledAt: { gte: new Date() }, status: "scheduled" },
      include: {
        application: { include: { jobPosting: { include: { requisition: { select: { tenantId: true } } } }, candidate: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }).then((rows) => rows.filter((i) => i.application.jobPosting.requisition.tenantId === tenantId)),
    prisma.interview.findMany({
      where: { status: "scheduled" },
      include: {
        application: { include: { jobPosting: { include: { requisition: { select: { tenantId: true } } } } } },
        feedback: true,
      },
    }).then((rows) => rows.filter((i) => i.application.jobPosting.requisition.tenantId === tenantId && i.feedback.length === 0).length),
    prisma.jobOffer.findMany({
      include: { application: { include: { jobPosting: { include: { requisition: { select: { tenantId: true } } } } } } },
    }).then((rows) => rows.filter((o) => o.application.jobPosting.requisition.tenantId === tenantId).length),
    prisma.jobOffer.findMany({
      where: { status: "accepted" },
      include: { application: { include: { jobPosting: { include: { requisition: { select: { tenantId: true } } } } } } },
    }).then((rows) => rows.filter((o) => o.application.jobPosting.requisition.tenantId === tenantId).length),
    prisma.application.count({
      where: { status: "hired" },
    }),
  ]);

  return {
    requisitions: { total: totalRequisitions, open: openRequisitions },
    postings: activePostings,
    candidates: totalCandidates,
    applications: { byStatus: applicationsByStatus },
    interviews: {
      upcoming: upcomingInterviews.map((i) => ({
        id: i.id,
        scheduledAt: i.scheduledAt,
        mode: i.mode,
        candidateName: `${i.application.candidate.firstName} ${i.application.candidate.lastName}`,
        jobTitle: i.application.jobPosting.title,
      })),
      pendingFeedback,
    },
    offers: { total: totalOffers, accepted: acceptedOffers },
    hired: hiredCount,
    conversionRate: totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0,
  };
}

export async function getRecruitmentReports(tenantId: string) {
  const allApps = await prisma.application.findMany({
    include: { jobPosting: { include: { requisition: { select: { tenantId: true } } } } },
  });
  const filtered = allApps.filter((a) => a.jobPosting.requisition.tenantId === tenantId);

  const stageCounts: Record<string, number> = {};
  for (const a of filtered) {
    stageCounts[a.status] = (stageCounts[a.status] || 0) + 1;
  }

  const requisitionsByStatus = await prisma.jobRequisition.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: true,
  });

  const topRequisitions = await prisma.jobRequisition.findMany({
    where: { tenantId },
    include: {
      _count: { select: { postings: true } },
      postings: { include: { _count: { select: { applications: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const requisitionStats = topRequisitions.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    openings: r.openings,
    totalApplications: r.postings.reduce((acc, p) => acc + p._count.applications, 0),
  }));

  const timeToHire = await prisma.application.findMany({
    where: { status: "hired", jobPosting: { requisition: { tenantId } } },
    select: { appliedAt: true, updatedAt: true },
  });
  const avgDaysToHire = timeToHire.length > 0
    ? Math.round(timeToHire.reduce((acc, a) => acc + (a.updatedAt.getTime() - a.appliedAt.getTime()) / 86400000, 0) / timeToHire.length)
    : 0;

  return {
    applicationsByStatus: stageCounts,
    requisitionsByStatus: requisitionsByStatus.map((r) => ({ status: r.status, count: r._count })),
    requisitionStats,
    avgDaysToHire,
    totalApplications: filtered.length,
  };
}
