import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import {
  ProtectedRoute,
  RoleGuard,
  getLandingPath,
} from "./components/ProtectedRoute";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import AuthLayout from "./layouts/AuthLayout";

// Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Role-specific home pages
import HRDashboardPage from "./pages/hr/HRDashboardPage";
import EngineerPanelPage from "./pages/engineer/EngineerPanelPage";
import CXOAnalyticsPage from "./pages/cxo/CXOAnalyticsPage";
import CollegeDashboardPage from "./pages/college/CollegeDashboardPage";
import StudentPortalPage from "./pages/student/StudentPortalPage";
import CollegeManagement from "./pages/hr/CollegeManagement";
import RoleManagement from "./pages/hr/RoleManagement";

// Shared / feature pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import StudentsPage from "./pages/students/StudentsPage";
import StudentProfilePage from "./pages/students/StudentProfilePage";
import StudentRegistrationPage from "./pages/students/StudentRegistrationPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import AdministrativePanel from "./pages/admin/AdministrativePanel";
import AssessmentsPage from "./pages/assessments/AssessmentsPage";
import AssessmentTakePage from "./pages/assessments/AssessmentTakePage";
import ExamInterfacePage from "./pages/assessments/ExamInterfacePage";
import QuestionWizard from "./pages/assessments/QuestionWizard";
import CodeEditor from "./pages/assessments/CodeEditor";
import AssessmentBlueprintWizard from "./pages/assessments/AssessmentBlueprintWizard";
import SegmentationPage from "./pages/segmentation/SegmentationPage";
import ProctoringMonitorPage from "./pages/proctoring/ProctoringMonitorPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import NotFoundPage from "./pages/NotFoundPage";
import NotAuthorizedPage from "./pages/NotAuthorizedPage";
import StudentOnboardingWizard from "./components/StudentOnboardingWizard";

// ── Smart root redirect ─────────────────────────────────────────────────────
function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={getLandingPath(user)} replace />;
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* ── Auth (public) ─────────────────────────────────────────── */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      {/* Student self-registration (public, needs camera) */}
      <Route path="/register-student" element={<StudentRegistrationPage />} />

      {/* Not-authorized (public, shown after role mismatch) */}
      <Route path="/not-authorized" element={<NotAuthorizedPage />} />

      {/* ── Student onboarding (protected, student only) ──────────── */}
      <Route
        path="/student-onboarding"
        element={
          <ProtectedRoute>
            <StudentOnboardingWizard />
          </ProtectedRoute>
        }
      />

      {/* ── Exam interface (fullscreen, outside dashboard layout) ── */}
      <Route
        path="/exams/:id/take"
        element={
          <ProtectedRoute>
            <RoleGuard allowed={["student"]}>
              <ExamInterfacePage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* ── Role-based dashboard routes ───────────────────────────── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Root → redirect to role-appropriate home */}
        <Route index element={<RootRedirect />} />

        {/* HR Dashboard (hr, super_admin, cxo read-only) */}
        <Route
          path="hr-dashboard"
          element={
            <RoleGuard allowed={["hr", "super_admin", "cxo"]}>
              <HRDashboardPage />
            </RoleGuard>
          }
        />

        {/* Engineer Panel (engineer only) */}
        <Route
          path="engineer-panel"
          element={
            <RoleGuard allowed={["engineer"]}>
              <EngineerPanelPage />
            </RoleGuard>
          }
        />

        {/* CXO Analytics (cxo, super_admin) */}
        <Route
          path="cxo-analytics"
          element={
            <RoleGuard allowed={["cxo", "super_admin"]}>
              <CXOAnalyticsPage />
            </RoleGuard>
          }
        />

        <Route
          path="college-dashboard"
          element={
            <RoleGuard allowed={["college_admin", "college", "college_staff"]}>
              <CollegeDashboardPage />
            </RoleGuard>
          }
        />

        {/* Student Portal (student) */}
        <Route
          path="student-portal"
          element={
            <RoleGuard allowed={["student"]}>
              <StudentPortalPage />
            </RoleGuard>
          }
        />

        {/* ── Shared feature routes (role-restricted) ─────────────── */}

        {/* Legacy overview (admin view) */}
        <Route
          path="overview"
          element={
            <RoleGuard allowed={["super_admin", "hr", "cxo"]}>
              <DashboardPage />
            </RoleGuard>
          }
        />

        {/* Student management — Admin, HR, CxO (read), college_admin */}
        <Route
          path="students"
          element={
            <RoleGuard allowed={["super_admin", "hr", "cxo", "college_admin"]}>
              <StudentsPage />
            </RoleGuard>
          }
        />
        <Route
          path="students/:id"
          element={
            <RoleGuard allowed={["super_admin", "hr", "cxo", "college_admin"]}>
              <StudentProfilePage />
            </RoleGuard>
          }
        />

        {/* Unified Administration — Admin, HR, CxO */}
        <Route
          path="administration"
          element={
            <RoleGuard allowed={["super_admin", "admin", "hr", "cxo"]}>
              <AdministrativePanel />
            </RoleGuard>
          }
        />

        {/* Legacy redirects or individual paths if needed */}
        <Route path="users" element={<Navigate to="/administration" replace />} />
        <Route path="roles" element={<Navigate to="/administration" replace />} />

        {/* Assessments — Admin, HR, college_admin, engineer */}
        <Route
          path="assessments"
          element={
            <RoleGuard allowed={["super_admin", "hr", "college_admin", "engineer"]}>
              <AssessmentsPage />
            </RoleGuard>
          }
        />
        <Route
          path="assessments/wizard"
          element={
            <RoleGuard allowed={["super_admin", "hr", "college_admin"]}>
              <QuestionWizard />
            </RoleGuard>
          }
        />
        <Route
          path="assessments/blueprint"
          element={
            <RoleGuard allowed={["super_admin", "hr", "college_admin"]}>
              <AssessmentBlueprintWizard />
            </RoleGuard>
          }
        />
        <Route
          path="assessments/code-editor"
          element={
            <RoleGuard allowed={["super_admin", "hr", "college_admin", "engineer"]}>
              <CodeEditor />
            </RoleGuard>
          }
        />
        <Route
          path="assessments/:id/take"
          element={
            <RoleGuard allowed={["student"]}>
              <AssessmentTakePage />
            </RoleGuard>
          }
        />

        {/* Segmentation — Admin, HR */}
        <Route
          path="segmentation"
          element={
            <RoleGuard allowed={["super_admin", "hr"]}>
              <SegmentationPage />
            </RoleGuard>
          }
        />

        {/* Campuses — Admin, HR */}
        <Route
          path="campuses"
          element={
            <RoleGuard allowed={["super_admin", "hr"]}>
              <CollegeManagement />
            </RoleGuard>
          }
        />

        {/* Proctoring — Admin, HR, Engineer, college_admin */}
        <Route
          path="proctoring"
          element={
            <RoleGuard allowed={["super_admin", "hr", "engineer", "college_admin"]}>
              <ProctoringMonitorPage />
            </RoleGuard>
          }
        />

        {/* Analytics — Admin, HR, CxO, Engineer */}
        <Route
          path="analytics"
          element={
            <RoleGuard allowed={["super_admin", "hr", "cxo", "engineer"]}>
              <AnalyticsPage />
            </RoleGuard>
          }
        />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
