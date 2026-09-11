import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute, RoleGate } from "./auth/guards";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { HomePage } from "./pages/home/HomePage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { EmployeesPage } from "./pages/employees/EmployeesPage";
import { EmployeeDetailPage } from "./pages/employees/EmployeeDetailPage";
import { DirectoryPage } from "./pages/employees/DirectoryPage";
import { EmployeeDocumentsPage } from "./pages/employees/EmployeeDocumentsPage";
import { SelfServicePage } from "./pages/employees/SelfServicePage";
import { OrganizationPage } from "./pages/organization/OrganizationPage";
import { LeavePage } from "./pages/leave/LeavePage";
import { AttendancePage } from "./pages/attendance/AttendancePage";
import { RolesPage } from "./pages/settings/RolesPage";
import { UsersPage } from "./pages/settings/UsersPage";
import { CompanySettingsPage } from "./pages/settings/CompanySettingsPage";
import { AuditLogsPage } from "./pages/settings/AuditLogsPage";
import { NotificationsPage } from "./pages/notifications/NotificationsPage";
import { PlaceholderPage } from "./components/ui/PlaceholderPage";
import { AppLayout } from "./components/layout/AppLayout";
import { RequisitionsPage } from "./pages/recruitment/RequisitionsPage";
import { PostingsPage } from "./pages/recruitment/PostingsPage";
import { CandidatesPage } from "./pages/recruitment/CandidatesPage";
import { PipelinePage } from "./pages/recruitment/PipelinePage";
import { InterviewsPage } from "./pages/recruitment/InterviewsPage";
import { OffersPage } from "./pages/recruitment/OffersPage";
import { RecruitmentReportsPage } from "./pages/recruitment/RecruitmentReportsPage";
import { MyPayslipsPage } from "./pages/payroll/MyPayslipsPage";
import { PayrollManagerDashboard } from "./pages/payroll/PayrollManagerDashboard";
import { PayrollRunsPage } from "./pages/payroll/PayrollRunsPage";
import { SalaryStructuresPage } from "./pages/payroll/SalaryStructuresPage";
import { EmployeeSalariesPage } from "./pages/payroll/EmployeeSalariesPage";
import { PayrollPeriodsPage } from "./pages/payroll/PayrollPeriodsPage";
import { PayslipsPage } from "./pages/payroll/PayslipsPage";
import { TaxesPage } from "./pages/payroll/TaxesPage";
import { BonusesPage } from "./pages/payroll/BonusesPage";
import { OvertimePage } from "./pages/payroll/OvertimePage";
import { PayrollReportsPage } from "./pages/payroll/PayrollReportsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <AppLayout>
                  <HomePage />
                </AppLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <RoleGate permission="employee:read" denyForRoles={["recruiter"]}>
                    <EmployeesPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/directory"
              element={
                <ProtectedRoute>
                  <RoleGate permission="employee:read" denyForRoles={["recruiter"]}>
                    <DirectoryPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/documents"
              element={
                <ProtectedRoute>
                  <RoleGate permission="employee:read" denyForRoles={["recruiter"]}>
                    <EmployeeDocumentsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/self-service"
              element={
                <ProtectedRoute>
                  <RoleGate permission="employee:read" denyForRoles={["recruiter"]}>
                    <SelfServicePage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute>
                  <RoleGate permission="employee:read" denyForRoles={["recruiter"]}>
                    <EmployeeDetailPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/organization"
              element={
                <ProtectedRoute>
                  <RoleGate permission="org:manage">
                    <OrganizationPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave"
              element={
                <ProtectedRoute>
                  <RoleGate permission="leave:apply">
                    <LeavePage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <RoleGate permission="attendance:check_in">
                    <AttendancePage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:view">
                    <MyPayslipsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:read_all">
                    <PayrollManagerDashboard />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/runs"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:read_all">
                    <PayrollRunsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/salary-structures"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:read_all">
                    <SalaryStructuresPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/employee-salaries"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:read_all">
                    <EmployeeSalariesPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/periods"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:read_all">
                    <PayrollPeriodsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/payslips"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:read_all">
                    <PayslipsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/taxes"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:read_all">
                    <TaxesPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/bonuses"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:read_all">
                    <BonusesPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/overtime"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:read_all">
                    <OvertimePage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/reports"
              element={
                <ProtectedRoute>
                  <RoleGate permission="payroll:read_all">
                    <PayrollReportsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <RoleGate permission="expense:submit">
                    <PlaceholderPage title="Expenses" description="Expense categories, submissions, approvals, and reimbursements." />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            {/* Recruitment sub-routes */}
            <Route
              path="/recruitment"
              element={
                <ProtectedRoute>
                  <RoleGate permission="ats:manage_candidate">
                    <PlaceholderPage title="Recruitment" description="Overview of recruitment activities." />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/requisitions"
              element={
                <ProtectedRoute>
                  <RoleGate permission="ats:manage_requisition">
                    <RequisitionsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/postings"
              element={
                <ProtectedRoute>
                  <RoleGate permission="ats:manage_candidate">
                    <PostingsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/candidates"
              element={
                <ProtectedRoute>
                  <RoleGate permission="ats:manage_candidate">
                    <CandidatesPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/pipeline"
              element={
                <ProtectedRoute>
                  <RoleGate permission="ats:manage_candidate">
                    <PipelinePage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/interviews"
              element={
                <ProtectedRoute>
                  <RoleGate permission="ats:interview">
                    <InterviewsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/offers"
              element={
                <ProtectedRoute>
                  <RoleGate permission="ats:offer">
                    <OffersPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/reports"
              element={
                <ProtectedRoute>
                  <RoleGate permission="ats:manage_candidate">
                    <RecruitmentReportsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <ProtectedRoute>
                  <RoleGate permission="asset:manage">
                    <PlaceholderPage title="Assets" description="Company assets, assignments, returns, and inventory tracking." />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <RoleGate permission="report:employee">
                    <PlaceholderPage title="Reports" description="Employee, attendance, leave, payroll, and headcount analytics." />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/users"
              element={
                <ProtectedRoute>
                  <RoleGate permission="user:manage">
                    <UsersPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/roles"
              element={
                <ProtectedRoute>
                  <RoleGate permission="role:manage">
                    <RolesPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/company"
              element={
                <ProtectedRoute>
                  <RoleGate permission="settings:system">
                    <CompanySettingsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/audit"
              element={
                <ProtectedRoute>
                  <RoleGate permission="audit:read">
                    <AuditLogsPage />
                  </RoleGate>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
