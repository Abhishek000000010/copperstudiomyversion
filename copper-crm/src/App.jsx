import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ToastProvider } from "./components/ToastProvider";

import Dashboard from "./pages/Dashboard";
import Companies from "./pages/crm/Companies";
import CompanyDetail from "./pages/crm/CompanyDetail";
import Contacts from "./pages/crm/Contacts";
import ContactDetail from "./pages/crm/ContactDetail";
import ProjectsList from "./pages/projects/ProjectsList";
import KanbanBoard from "./pages/projects/KanbanBoard";
import Invoices from "./pages/billing/Invoices";
import Coupons from "./pages/billing/Coupons";
import ClientDashboard from "./pages/client/ClientDashboard";
import {
  ClientBillingPage,
  ClientDocumentsPage,
  ClientMeetingsPage,
  ClientPurchasesPage,
  ClientSettingsPage,
  ClientSupportPage,
  ClientTimelinePage
} from "./pages/client/ClientPages";
import { ForgotPasswordPage, LoginPage, SetPasswordPage } from "./pages/auth/AuthPages";
import {
  ReportsPage,
  SettingsPage,
  TasksPage
} from "./pages/admin/AdminWorkflows";
import { AnalyticsPage, DatabaseTablesPage, ProposalGeneratorPage, ServicesPage } from "./pages/admin/AdminTabs";
import Communication from "./pages/admin/Communication";
import ClientProjectsPage from "./pages/admin/ClientProjectsPage";
import ProjectGantt from "./pages/projects/ProjectGantt";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import PackagesPage from "./pages/admin/PackagesPage";

function LegacyProjectRedirect({ tab }) {
  const { companyId, projectId } = useParams();
  const tabParam = tab ? `&tab=${tab}` : "";
  return <Navigate to={`/admin/client-projects?clientId=${companyId}&projectId=${projectId}${tabParam}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/client-secure-onboarding/access-setup" element={<SetPasswordPage />} />

          {/* Admin */}
          <Route element={<ProtectedRoute role="superadmin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="companies" element={<Companies />} />
              <Route path="companies/:companyId" element={<CompanyDetail />} />
              <Route path="companies/:companyId/projects/:projectId" element={<LegacyProjectRedirect />} />
              <Route path="companies/:companyId/projects/:projectId/tasks" element={<ProjectGantt />} />
              <Route path="companies/:companyId/projects/:projectId/files" element={<LegacyProjectRedirect tab="deliverables" />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="contacts/:contactId" element={<ContactDetail />} />
              <Route path="leads" element={<Navigate to="/admin/contacts" replace />} />
              <Route path="deals" element={<Navigate to="/admin/contacts" replace />} />
              <Route path="deals/:dealId" element={<Navigate to="/admin/contacts" replace />} />
              <Route path="projects" element={<ProjectsList />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="kanban" element={<KanbanBoard />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="orders" element={<Navigate to="/admin/contacts" replace />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="services" element={<Navigate to="/admin/services/coupon-generator" replace />} />
              <Route path="services/coupon-generator" element={<ServicesPage />} />
              <Route path="services/packages" element={<PackagesPage />} />
              <Route path="services/proposal-generator" element={<ProposalGeneratorPage />} />
              <Route path="services/communications" element={<Communication />} />
              <Route path="proposal-generator" element={<Navigate to="/admin/services/proposal-generator" replace />} />
              <Route path="database" element={<DatabaseTablesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="client-projects" element={<ClientProjectsPage />} />
            </Route>
          </Route>

          {/* Client Portal */}
          <Route element={<ProtectedRoute role="user" />}>
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<ClientDashboard />} />
              <Route path="purchases" element={<ClientPurchasesPage />} />
              <Route path="projects" element={<ClientTimelinePage />} />
              <Route path="meetings" element={<ClientMeetingsPage />} />
              <Route path="documents" element={<ClientDocumentsPage />} />
              <Route path="invoices" element={<ClientBillingPage />} />
              <Route path="support" element={<ClientSupportPage />} />
              <Route path="profile" element={<ClientSettingsPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
