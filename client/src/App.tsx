import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BookAppointment } from './pages/BookAppointment';
import { PatientRegistration } from './pages/PatientRegistration';
import { PatientDirectory } from './pages/PatientDirectory';
import { PatientProfile } from './pages/PatientProfile';
import { AppointmentManagement } from './pages/AppointmentManagement';
import { PatientCheckIn } from './pages/PatientCheckIn';
import { WaitingQueue } from './pages/WaitingQueue';
import { PublicQueueDisplay } from './pages/PublicQueueDisplay';
import { DoctorDirectory } from './pages/DoctorDirectory';
import { DoctorForm } from './pages/DoctorForm';
import { DoctorScheduleManagement } from './pages/DoctorScheduleManagement';
import { DoctorCalendar } from './pages/DoctorCalendar';
import { DepartmentManagement } from './pages/DepartmentManagement';
import { UserManagement } from './pages/UserManagement';
import { AuditLogs } from './pages/AuditLogs';
import { HospitalSettingsPage } from './pages/HospitalSettingsPage';
import { AccessDenied, NotFound } from './pages/AccessDenied';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/queue/display" element={<PublicQueueDisplay />} />

      {/* Protected Operations Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="check-in" element={<PatientCheckIn />} />
        <Route path="queue" element={<WaitingQueue />} />

        {/* Patients */}
        <Route path="patients" element={<PatientDirectory />} />
        <Route path="patients/register" element={<PatientRegistration />} />
        <Route path="patients/:id" element={<PatientProfile />} />

        {/* Appointments */}
        <Route path="appointments" element={<AppointmentManagement />} />
        <Route path="appointments/book" element={<BookAppointment />} />

        {/* Clinical Doctors & Departments */}
        <Route path="doctors" element={<DoctorDirectory />} />
        <Route
          path="doctors/new"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DoctorForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctors/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DoctorForm />
            </ProtectedRoute>
          }
        />
        <Route path="doctors/:id/schedule" element={<DoctorScheduleManagement />} />
        <Route path="calendar" element={<DoctorCalendar />} />
        <Route path="departments" element={<DepartmentManagement />} />

        {/* Administration */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <HospitalSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Status fallback */}
        <Route path="access-denied" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;
