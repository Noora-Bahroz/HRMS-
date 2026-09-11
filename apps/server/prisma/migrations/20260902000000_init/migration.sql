-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "payload" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "logoFileId" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "costCenterId" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leadEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "teamId" TEXT,
    "designationId" TEXT,
    "reportingManagerId" TEXT,
    "costCenterId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfJoining" TIMESTAMP(3),
    "dateOfExit" TIMESTAMP(3),
    "employmentStatus" TEXT NOT NULL DEFAULT 'active',
    "employmentType" TEXT,
    "maritalStatus" TEXT,
    "avatarFileId" TEXT,
    "address" TEXT,
    "exitReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSkill" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "level" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Qualification" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "year" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentHistory" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmploymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "maxPerYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL DEFAULT 'all',
    "departmentId" TEXT,
    "accrualRuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "entitled" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "used" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "available" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" DECIMAL(5,2) NOT NULL,
    "reason" TEXT,
    "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApproval" (
    "id" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveAccrualRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accrualType" TEXT NOT NULL,
    "amount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "capPerYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveAccrualRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "gracePeriodMins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT,
    "scheduleId" TEXT,
    "date" DATE NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'present',
    "totalHours" DECIMAL(6,2),
    "overtimeMins" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceBreak" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL,
    "salaryStructureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSalaryAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "salaryStructureId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSalaryAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "grossPay" DECIMAL(12,2) NOT NULL,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "netPay" DECIMAL(12,2) NOT NULL,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxSlab" (
    "id" TEXT NOT NULL,
    "taxConfigId" TEXT NOT NULL,
    "fromAmount" DECIMAL(12,2) NOT NULL,
    "toAmount" DECIMAL(12,2),
    "ratePercent" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxSlab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRequisition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "departmentId" TEXT,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "postedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resumeFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "stage" INTEGER NOT NULL DEFAULT 1,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "interviewerId" TEXT,
    "mode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewFeedback" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOffer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "salary" DECIMAL(12,2),
    "startDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "date" DATE NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reimbursedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseReceipt" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseApproval" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetTypeId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNo" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "condition" TEXT NOT NULL DEFAULT 'good',
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAssignment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "conditionOnReturn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "type" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_resource_idx" ON "AuditLog"("tenantId", "resource");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE INDEX "Department_branchId_idx" ON "Department"("branchId");

-- CreateIndex
CREATE INDEX "Team_departmentId_idx" ON "Team"("departmentId");

-- CreateIndex
CREATE INDEX "Designation_tenantId_idx" ON "Designation"("tenantId");

-- CreateIndex
CREATE INDEX "CostCenter_companyId_idx" ON "CostCenter"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeNumber_key" ON "Employee"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_tenantId_departmentId_idx" ON "Employee"("tenantId", "departmentId");

-- CreateIndex
CREATE INDEX "Employee_tenantId_employmentStatus_idx" ON "Employee"("tenantId", "employmentStatus");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "EmergencyContact_employeeId_idx" ON "EmergencyContact"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_employeeId_idx" ON "EmployeeDocument"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeSkill_employeeId_idx" ON "EmployeeSkill"("employeeId");

-- CreateIndex
CREATE INDEX "Qualification_employeeId_idx" ON "Qualification"("employeeId");

-- CreateIndex
CREATE INDEX "Certification_employeeId_idx" ON "Certification"("employeeId");

-- CreateIndex
CREATE INDEX "EmploymentHistory_employeeId_idx" ON "EmploymentHistory"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveType_tenantId_idx" ON "LeaveType"("tenantId");

-- CreateIndex
CREATE INDEX "LeavePolicy_tenantId_idx" ON "LeavePolicy"("tenantId");

-- CreateIndex
CREATE INDEX "LeaveBalance_tenantId_employeeId_idx" ON "LeaveBalance"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_tenantId_employeeId_idx" ON "LeaveRequest"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_tenantId_status_idx" ON "LeaveRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LeaveApproval_leaveRequestId_idx" ON "LeaveApproval"("leaveRequestId");

-- CreateIndex
CREATE INDEX "Shift_tenantId_idx" ON "Shift"("tenantId");

-- CreateIndex
CREATE INDEX "WorkSchedule_tenantId_employeeId_idx" ON "WorkSchedule"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "Attendance_tenantId_employeeId_idx" ON "Attendance"("tenantId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_tenantId_employeeId_date_key" ON "Attendance"("tenantId", "employeeId", "date");

-- CreateIndex
CREATE INDEX "AttendanceBreak_attendanceId_idx" ON "AttendanceBreak"("attendanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_tenantId_date_key" ON "Holiday"("tenantId", "date");

-- CreateIndex
CREATE INDEX "SalaryStructure_tenantId_idx" ON "SalaryStructure"("tenantId");

-- CreateIndex
CREATE INDEX "SalaryComponent_salaryStructureId_idx" ON "SalaryComponent"("salaryStructureId");

-- CreateIndex
CREATE INDEX "EmployeeSalaryAssignment_employeeId_idx" ON "EmployeeSalaryAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_tenantId_idx" ON "PayrollPeriod"("tenantId");

-- CreateIndex
CREATE INDEX "PayrollRun_payrollPeriodId_idx" ON "PayrollRun"("payrollPeriodId");

-- CreateIndex
CREATE INDEX "Payslip_payrollRunId_idx" ON "Payslip"("payrollRunId");

-- CreateIndex
CREATE INDEX "Payslip_tenantId_employeeId_idx" ON "Payslip"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "TaxConfig_tenantId_idx" ON "TaxConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TaxSlab_taxConfigId_idx" ON "TaxSlab"("taxConfigId");

-- CreateIndex
CREATE INDEX "JobRequisition_tenantId_status_idx" ON "JobRequisition"("tenantId", "status");

-- CreateIndex
CREATE INDEX "JobPosting_requisitionId_idx" ON "JobPosting"("requisitionId");

-- CreateIndex
CREATE INDEX "Candidate_tenantId_email_idx" ON "Candidate"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Application_jobPostingId_idx" ON "Application"("jobPostingId");

-- CreateIndex
CREATE INDEX "Application_candidateId_idx" ON "Application"("candidateId");

-- CreateIndex
CREATE INDEX "Interview_applicationId_idx" ON "Interview"("applicationId");

-- CreateIndex
CREATE INDEX "InterviewFeedback_interviewId_idx" ON "InterviewFeedback"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "JobOffer_applicationId_key" ON "JobOffer"("applicationId");

-- CreateIndex
CREATE INDEX "ExpenseCategory_tenantId_idx" ON "ExpenseCategory"("tenantId");

-- CreateIndex
CREATE INDEX "Expense_tenantId_employeeId_idx" ON "Expense"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "Expense_tenantId_status_idx" ON "Expense"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ExpenseReceipt_expenseId_idx" ON "ExpenseReceipt"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseApproval_expenseId_idx" ON "ExpenseApproval"("expenseId");

-- CreateIndex
CREATE INDEX "Asset_tenantId_idx" ON "Asset"("tenantId");

-- CreateIndex
CREATE INDEX "Asset_tenantId_status_idx" ON "Asset"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AssetType_tenantId_idx" ON "AssetType"("tenantId");

-- CreateIndex
CREATE INDEX "AssetAssignment_assetId_idx" ON "AssetAssignment"("assetId");

-- CreateIndex
CREATE INDEX "AssetAssignment_employeeId_idx" ON "AssetAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "File_tenantId_ownerId_idx" ON "File"("tenantId", "ownerId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_userId_readAt_idx" ON "Notification"("tenantId", "userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_code_key" ON "NotificationTemplate"("code");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkill" ADD CONSTRAINT "EmployeeSkill_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentHistory" ADD CONSTRAINT "EmploymentHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicy" ADD CONSTRAINT "LeavePolicy_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicy" ADD CONSTRAINT "LeavePolicy_accrualRuleId_fkey" FOREIGN KEY ("accrualRuleId") REFERENCES "LeaveAccrualRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApproval" ADD CONSTRAINT "LeaveApproval_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "WorkSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceBreak" ADD CONSTRAINT "AttendanceBreak_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryAssignment" ADD CONSTRAINT "EmployeeSalaryAssignment_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxSlab" ADD CONSTRAINT "TaxSlab_taxConfigId_fkey" FOREIGN KEY ("taxConfigId") REFERENCES "TaxConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseReceipt" ADD CONSTRAINT "ExpenseReceipt_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "AssetType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

