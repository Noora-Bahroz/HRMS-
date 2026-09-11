-- CreateTable
CREATE TABLE "SalaryBonus" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimeEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(6,2) NOT NULL,
    "rateFactor" DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OvertimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryBonus_tenantId_employeeId_idx" ON "SalaryBonus"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "OvertimeEntry_tenantId_employeeId_idx" ON "OvertimeEntry"("tenantId", "employeeId");
