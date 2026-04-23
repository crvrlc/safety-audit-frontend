import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/LoginPage'
import AuthCallback from './pages/auth/AuthCallback'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

// Officer pages
import OfficerDashboard from './pages/officer/OfficerDashboard'
import OfficerInspections from './pages/officer/OfficerInspections'
import OfficerSchedule from './pages/officer/OfficerSchedule'
import OfficerConduct from './pages/officer/OfficerConduct'
import OfficerChecklist from './pages/officer/OfficerChecklist'
import OfficerReports from './pages/officer/OfficerReports'
import OfficerHome from './pages/officer/OfficerHome'
import ResourcesPage from './pages/misc/ResourcesPage'
import SettingsPage from './pages/misc/SettingsPage'
import OfficerFindings from './pages/officer/OfficerFindings'
import OfficerReview from './pages/officer/OfficerReview'
import OfficerSuccess from './pages/officer/OfficerSuccess'
import OfficerRecords from './pages/officer/OfficerRecords'
import OfficerFindingsRecords from './pages/officer/OfficerFindingsRecords'
import OfficerArchived from './pages/officer/OfficerArchived'
import OfficerPendingReview from './pages/officer/OfficerPendingReview'
import OfficerCompliance from './pages/officer/OfficerCompliance'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminHome from './pages/admin/AdminHome'
import AdminUsers from './pages/admin/AdminUsers'
import AdminChecklists from './pages/admin/AdminChecklists'
import EditTemplate from './pages/admin/EditTemplate'
import AddSection from './pages/admin/AddSection'
import {AdminRecords, AdminAnalytics, AdminMonitoring} from './pages/admin/AdminPlaceholders'
import AdminActivity from './pages/admin/AdminActivity'
import AdminFacilities from './pages/admin/FacilitiesPage'
import AdminAuditRecords from './pages/admin/AdminAuditRecords'

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManagerHome       from './pages/manager/ManagerHome'
import ManagerFindings   from './pages/manager/ManagerFindings'
import ManagerMaintenance from './pages/manager/ManagerMaintenance'
import ManagerRecords    from './pages/manager/ManagerRecords'
import ManagerCompliance from './pages/manager/ManagerCompliance'
import ManagerSettings   from './pages/manager/ManagerSettings'
import ManagerInspectionReview from './pages/manager/ManagerInspectionReview'

import NotificationPage from './pages/misc/NotificationPage'
// Placeholder pages
const Placeholder = ({ title }) => (
  <div style={{ padding: '24px' }}><h4>{title}</h4></div>
)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Inspector */}
          <Route path="/officer" element={
            <ProtectedRoute allowedRoles={['safety_officer']}>
              <OfficerDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard"     element={<OfficerHome />} />
            <Route path="inspections"   element={<OfficerInspections />} />
            <Route path="inspections/:id/start"     element={<OfficerConduct />} />
            <Route path="inspections/:id/checklist" element={<OfficerChecklist />} />
            <Route path="inspections/:id/findings" element={<OfficerFindings />} />
            <Route path="inspections/:id/review"    element={<OfficerReview />} />
            <Route path="inspections/:id/success"  element={<OfficerSuccess />} />
            <Route path="schedule"      element={<OfficerSchedule />} />
            <Route path="schedule/:id/edit" element={<OfficerSchedule />} />
            <Route path="records"       element={<OfficerRecords />} />
            <Route path="archived"      element={<OfficerArchived />} />
            <Route path="findings"       element={<OfficerFindingsRecords />} />
            <Route path="compliance"    element={<OfficerCompliance />} />
            <Route path="resources"     element={<ResourcesPage />} />
            <Route path="settings"      element={<SettingsPage />} />
            <Route path="inspections/:id/pending-review" element={<OfficerPendingReview />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/notifications" element={<NotificationPage />} />
          </Route>

          {/* Manager*/}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['facility_manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" />} />
            <Route index         element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"   element={<ManagerHome />} />
            <Route path="findings"    element={<ManagerFindings />} />
            <Route path="maintenance" element={<ManagerMaintenance />} />
            <Route path="records"     element={<ManagerRecords />} />
            <Route path="compliance"  element={<ManagerCompliance />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/notifications" element={<NotificationPage />} />
            <Route path="inspections/:id/review" element={<ManagerInspectionReview />} />
          </Route>

          
          {/* Admin */}
           <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard"                      element={<AdminHome />} />
            <Route path="users"                          element={<AdminUsers />} />
            <Route path="checklists"                     element={<AdminChecklists />} />
            <Route path="checklists/edit/:sectionId"     element={<EditTemplate />} />
            <Route path="checklists/new-section"         element={<AddSection />} />
            <Route path="records"                        element={<AdminAuditRecords />} />
            <Route path="analytics"                      element={<AdminAnalytics />} />
            <Route path="monitoring"                     element={<AdminMonitoring />} />
            <Route path="activity"                       element={<AdminActivity />} />
            <Route path="facilities"                     element={<AdminFacilities />} />
            {/* <Route path="audit-records"                  element={<AdminAuditRecords />} /> */}
          </Route>



          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App