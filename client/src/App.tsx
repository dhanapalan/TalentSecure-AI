import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import {
  ProtectedRoute,
  RoleGuard,
  getLandingPath,
} from "./components/ProtectedRoute";

// Layouts
import PublicLayout from "./layouts/PublicLayout";

// Public pages
import LandingPage from "./pages/public/LandingPage";
import PricingPage from "./pages/public/PricingPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import LateralPage from "./pages/public/LateralPage";
import LateralContactPage from "./pages/public/LateralContactPage";
import CampusPage from "./pages/public/CampusPage";
import CampusContactPage from "./pages/public/CampusContactPage";
import PrivacyPage from "./pages/public/PrivacyPage";
import TermsPage from "./pages/public/TermsPage";
import NotFoundPage from "./pages/NotFoundPage";

// Lazy-loaded non-landing routes
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const AuthLayout = lazy(() => import("./layouts/AuthLayout"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const PasswordSetupPage = lazy(() => import("./pages/auth/PasswordSetupPage"));
const HRDashboardPage = lazy(() => import("./pages/hr/HRDashboardPage"));
const EngineerPanelPage = lazy(() => import("./pages/engineer/EngineerPanelPage"));
const CXOAnalyticsPage = lazy(() => import("./pages/cxo/CXOAnalyticsPage"));
const CollegeDashboardPage = lazy(() => import("./pages/college/CollegeDashboardPage"));
const StudentPortalPage = lazy(() => import("./pages/student/StudentPortalPage"));
const CollegeManagement = lazy(() => import("./pages/hr/CollegeManagement"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const StudentsPage = lazy(() => import("./pages/students/StudentsPage"));
const StudentProfilePage = lazy(() => import("./pages/students/StudentProfilePage"));
const StudentRegistrationPage = lazy(() => import("./pages/students/StudentRegistrationPage"));
const AdministrativePanel = lazy(() => import("./pages/admin/AdministrativePanel"));
const AssessmentStudioPage = lazy(() => import("./pages/assessments/AssessmentStudioPage"));
const AssessmentTakePage = lazy(() => import("./pages/assessments/AssessmentTakePage"));
const ExamInterfacePage = lazy(() => import("./pages/assessments/ExamInterfacePage"));
const QuestionWizard = lazy(() => import("./pages/assessments/QuestionWizard"));
const CodeEditor = lazy(() => import("./pages/assessments/CodeEditor"));
const AssessmentBlueprintWizard = lazy(() => import("./pages/assessments/AssessmentBlueprintWizard"));
const ExamQuestionsPage = lazy(() => import("./pages/assessments/ExamQuestionsPage"));
const SegmentationPage = lazy(() => import("./pages/segmentation/SegmentationPage"));
const ProctoringMonitorPage = lazy(() => import("./pages/proctoring/ProctoringMonitorPage"));
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage"));
const NotAuthorizedPage = lazy(() => import("./pages/NotAuthorizedPage"));
const StudentOnboardingWizard = lazy(() => import("./components/StudentOnboardingWizard"));

// ── Helper redirects ─────────────────────────────────────────────────────────
function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={getLandingPath(user)} replace />;
}

function LegacyStudentRegistrationRedirect() {
  const location = useLocation();
  return <Navigate to={`/student/register${location.search}`} replace />;
}

function LegacyStudentExamRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <Navigate to="/app/student-portal" replace />;
  }
  return <Navigate to={`/student/exams/${id}/take`} replace />;
}

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-sm font-semibold text-slate-500">
      Loading workspace...
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* ── Public website ─────────────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/lateral" element={<LateralPage />} />
          <Route path="/lateral/contact" element={<LateralContactPage />} />
          <Route path="/campus" element={<CampusPage />} />
          <Route path="/campus/contact" element={<CampusContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Route>

        {/* ── Auth (public) ─────────────────────────────────────────── */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="setup-password" element={<PasswordSetupPage />} />
        </Route>

        {/* Student self-registration (public, needs camera) */}
        <Route path="/student/register" element={<StudentRegistrationPage />} />
        <Route path="/register-student" element={<LegacyStudentRegistrationRedirect />} />

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
          path="/student/exams/:id/take"
          element={
            <ProtectedRoute>
              <RoleGuard allowed={["student"]}>
                <ExamInterfacePage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route path="/exams/:id/take" element={<LegacyStudentExamRedirect />} />

        {/* ── Role-based dashboard routes (under /app) ──────────────── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
        {/* /app → redirect to role-appropriate home */}
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
        <Route path="users" element={<Navigate to="/app/administration" replace />} />
        <Route path="roles" element={<Navigate to="/app/administration" replace />} />

        {/* Assessments — Admin, HR, college_admin, engineer */}
        <Route
          path="assessments"
          element={
            <RoleGuard allowed={["super_admin", "hr", "college_admin", "engineer"]}>
              <AssessmentStudioPage />
            </RoleGuard>
          }
        />
        <Route path="assessments/bank" element={<Navigate to="/app/assessments?tab=bank" replace />} />
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
          path="assessments/:id/questions"
          element={
            <RoleGuard allowed={["super_admin", "hr", "college_admin", "engineer"]}>
              <ExamQuestionsPage />
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
    </Suspense>
  );
}
